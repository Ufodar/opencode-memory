import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { SQLiteMemoryDatabase } from "../../src/storage/sqlite/sqlite-memory-database.js"
import { PendingJobRepository } from "../../src/storage/sqlite/pending-job-repository.js"

const cleanupTasks: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const task = cleanupTasks.pop()
    if (task) {
      await task()
    }
  }
})

describe("PendingJobRepository", () => {
  test("persists pending jobs and claims them in session order", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-pending-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const database = new SQLiteMemoryDatabase(path.join(root, "memory.sqlite"))
    cleanupTasks.push(async () => database.close())

    const repository = new PendingJobRepository(database.handle)

    repository.enqueue({
      sessionID: "ses_demo",
      kind: "request-anchor",
      payload: { sessionID: "ses_demo", messageID: "msg_1", text: "第一条请求" },
    })
    repository.enqueue({
      sessionID: "ses_demo",
      kind: "session-idle",
      payload: { sessionID: "ses_demo" },
    })

    expect(repository.listSessionIDsWithPendingJobs()).toEqual(["ses_demo"])

    const first = repository.claimNext("ses_demo")
    expect(first?.kind).toBe("request-anchor")
    expect(first?.status).toBe("processing")

    repository.complete(first!.id)

    const second = repository.claimNext("ses_demo")
    expect(second?.kind).toBe("session-idle")
    expect(second?.status).toBe("processing")
  })

  test("resets processing jobs back to pending and keeps retry metadata", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-pending-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const database = new SQLiteMemoryDatabase(path.join(root, "memory.sqlite"))
    cleanupTasks.push(async () => database.close())

    const repository = new PendingJobRepository(database.handle)

    repository.enqueue({
      sessionID: "ses_demo",
      kind: "observation",
      payload: {
        toolInput: {
          tool: "read",
          sessionID: "ses_demo",
          callID: "call_1",
          args: { filePath: "brief.txt" },
        },
        output: {
          title: "读取 brief",
          output: "brief 内容",
          metadata: {},
        },
      },
    })

    const job = repository.claimNext("ses_demo")
    expect(job?.status).toBe("processing")

    repository.releaseForRetry(job!.id, "temporary failure")
    repository.resetProcessingToPending()

    const retried = repository.claimNext("ses_demo")
    expect(retried?.status).toBe("processing")
    expect(retried?.attemptCount).toBeGreaterThanOrEqual(1)
    expect(retried?.lastError).toBe("temporary failure")
  })
})
