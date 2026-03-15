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

    expect(repository.recordFailure(job!.id, "temporary failure")).toBe("pending")
    repository.resetProcessingToPending()

    const retried = repository.claimNext("ses_demo")
    expect(retried?.status).toBe("processing")
    expect(retried?.attemptCount).toBeGreaterThanOrEqual(1)
    expect(retried?.lastError).toBe("temporary failure")
  })

  test("marks a repeatedly failing job as failed after max attempts", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-pending-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const database = new SQLiteMemoryDatabase(path.join(root, "memory.sqlite"))
    cleanupTasks.push(async () => database.close())

    const repository = new PendingJobRepository(database.handle, { maxAttempts: 2 })

    repository.enqueue({
      sessionID: "ses_demo",
      kind: "session-idle",
      payload: { sessionID: "ses_demo" },
    })

    const firstAttempt = repository.claimNext("ses_demo")
    expect(firstAttempt?.attemptCount).toBe(1)
    expect(repository.recordFailure(firstAttempt!.id, "first failure")).toBe("pending")

    const secondAttempt = repository.claimNext("ses_demo")
    expect(secondAttempt?.attemptCount).toBe(2)
    expect(repository.recordFailure(secondAttempt!.id, "second failure")).toBe("failed")

    expect(repository.claimNext("ses_demo")).toBeNull()
    expect(repository.listSessionIDsWithPendingJobs()).toEqual([])

    const failedRow = database.handle
      .prepare(`
        SELECT status, attempt_count, last_error
        FROM pending_jobs
        WHERE id = ?
      `)
      .get(firstAttempt!.id) as {
      status: string
      attempt_count: number
      last_error: string | null
    }

    expect(failedRow).toEqual({
      status: "failed",
      attempt_count: 2,
      last_error: "second failure",
    })
  })

  test("lists failed jobs and retries them back to pending", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-pending-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const database = new SQLiteMemoryDatabase(path.join(root, "memory.sqlite"))
    cleanupTasks.push(async () => database.close())

    const repository = new PendingJobRepository(database.handle, { maxAttempts: 1 })

    repository.enqueue({
      sessionID: "ses_demo",
      kind: "request-anchor",
      payload: { sessionID: "ses_demo", messageID: "msg_1", text: "梳理第3章资格条件" },
    })

    const claimed = repository.claimNext("ses_demo")
    expect(claimed?.attemptCount).toBe(1)
    expect(repository.recordFailure(claimed!.id, "persistent failure")).toBe("failed")

    const failedJobs = repository.listFailedJobs(10)
    expect(failedJobs).toHaveLength(1)
    expect(failedJobs[0]).toEqual(
      expect.objectContaining({
        id: claimed!.id,
        sessionID: "ses_demo",
        kind: "request-anchor",
        attemptCount: 1,
        lastError: "persistent failure",
      }),
    )

    expect(repository.retryJob(claimed!.id)).toBe(true)
    expect(repository.listFailedJobs(10)).toEqual([])

    const retried = repository.claimNext("ses_demo")
    expect(retried?.id).toBe(claimed!.id)
    expect(retried?.status).toBe("processing")
    expect(retried?.lastError).toBeNull()
  })

  test("self-heals stale processing jobs back to pending on the next claim", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-pending-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const database = new SQLiteMemoryDatabase(path.join(root, "memory.sqlite"))
    cleanupTasks.push(async () => database.close())

    const repository = new PendingJobRepository(database.handle, { staleProcessingMs: 10 })

    repository.enqueue({
      sessionID: "ses_demo",
      kind: "session-idle",
      payload: { sessionID: "ses_demo" },
    })

    const claimed = repository.claimNext("ses_demo")
    expect(claimed?.status).toBe("processing")

    database.handle
      .prepare(`
        UPDATE pending_jobs
        SET started_processing_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(Date.now() - 1000, Date.now() - 1000, claimed!.id)

    const reclaimed = repository.claimNext("ses_demo")
    expect(reclaimed?.id).toBe(claimed?.id)
    expect(reclaimed?.status).toBe("processing")
    expect(reclaimed?.attemptCount).toBe(2)
  })
})
