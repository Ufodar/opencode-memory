import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  checkMemoryWorkerHealth,
  createMemoryWorkerHttpClient,
  getMemoryWorkerHealth,
  shutdownMemoryWorker,
} from "../../src/worker/client.js"
import { PendingJobRepository } from "../../src/storage/sqlite/pending-job-repository.js"
import { SQLiteMemoryDatabase } from "../../src/storage/sqlite/sqlite-memory-database.js"
import { readWorkerRegistryRecord } from "../../src/worker/registry.js"
import { startMemoryWorkerServer } from "../../src/worker/server.js"

const cleanupTasks: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const task = cleanupTasks.pop()
    if (task) {
      await task()
    }
  }
})

describe("memory worker http server", () => {
  test("serves the core memory pipeline over http", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    const request = await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    expect(request).toBeNull()

    const observation = await worker.captureObservationFromToolCall(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
        args: {
          filePath: "/workspace/demo/招标文件.docx",
        },
      },
      {
        title: "读取第3章资格条件",
        output: "资格条件包括近三年类似业绩、项目经理资质和安全生产许可。",
        metadata: {},
      },
    )

    expect(observation).toBeNull()

    const decisionObservation = await worker.captureObservationFromToolCall(
      {
        tool: "write",
        sessionID: "ses_demo",
        callID: "call_2",
        args: {
          filePath: "/workspace/demo/questions.md",
        },
      },
      {
        title: "写出缺口清单",
        output: "形成决策：先输出缺口清单，不进入正式写作。",
        metadata: {},
      },
    )

    expect(decisionObservation).toBeNull()

    const summaryResult = await worker.handleSessionIdle("ses_demo")
    expect(summaryResult).toEqual({ accepted: true })
    await waitForSummary(databasePath, 1)

    const systemContext = await worker.buildSystemContext({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })
    expect(systemContext[0]).toBe("[CONTINUITY]")

    const compactionContext = await worker.buildCompactionContext({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })
    expect(compactionContext[0]).toBe("[CONTINUITY CHECKPOINTS]")

    const search = await worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "资格条件",
      limit: 5,
    })

    expect(search.scope).toBe("session")
    expect(search.results.length).toBeGreaterThan(0)

    const firstId = search.results[0]?.id
    expect(firstId).toBeTruthy()

    const details = await worker.getMemoryDetails([firstId!])
    expect(details.length).toBe(1)
  })

  test("supports graceful shutdown over http", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })

    await shutdownMemoryWorker({
      baseUrl: server.baseUrl,
      requestTimeoutMs: 250,
    })

    const healthy = await checkMemoryWorkerHealth({
      baseUrl: server.baseUrl,
      requestTimeoutMs: 50,
    })

    expect(healthy).toBe(false)
  })

  test("reports worker version from health endpoint", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    const payload = await getMemoryWorkerHealth({
      baseUrl: server.baseUrl,
    })

    expect(payload?.ok).toBe(true)
    expect(typeof payload?.version).toBe("string")
    expect(payload?.version.length).toBeGreaterThan(0)
  })

  test("refreshes worker registry heartbeat and removes it on shutdown", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const registryPath = path.join(root, "worker-registry.json")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
      registryPath,
      heartbeatIntervalMs: 20,
    })

    const initialRecord = readWorkerRegistryRecord({
      registryPath,
      projectPath: "/workspace/demo",
      databasePath,
    })
    expect(initialRecord).not.toBeUndefined()

    await Bun.sleep(60)

    const refreshedRecord = readWorkerRegistryRecord({
      registryPath,
      projectPath: "/workspace/demo",
      databasePath,
    })
    expect(refreshedRecord).not.toBeUndefined()
    expect(refreshedRecord!.updatedAt).toBeGreaterThan(initialRecord!.updatedAt)

    await server.stop()

    const removedRecord = readWorkerRegistryRecord({
      registryPath,
      projectPath: "/workspace/demo",
      databasePath,
    })
    expect(removedRecord).toBeUndefined()
  })

  test("replays persisted pending jobs on worker startup", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const database = new SQLiteMemoryDatabase(databasePath)
    const pendingJobs = new PendingJobRepository(database.handle)

    pendingJobs.enqueue({
      sessionID: "ses_demo",
      kind: "request-anchor",
      payload: {
        sessionID: "ses_demo",
        messageID: "msg_1",
        text: "梳理第3章资格条件",
      },
    })
    pendingJobs.enqueue({
      sessionID: "ses_demo",
      kind: "observation",
      payload: {
        toolInput: {
          tool: "read",
          sessionID: "ses_demo",
          callID: "call_1",
          args: { filePath: "/workspace/demo/招标文件.docx" },
        },
        output: {
          title: "读取第3章资格条件",
          output: "资格条件包括近三年类似业绩、项目经理资质和安全生产许可。",
          metadata: {},
        },
      },
    })
    pendingJobs.enqueue({
      sessionID: "ses_demo",
      kind: "observation",
      payload: {
        toolInput: {
          tool: "write",
          sessionID: "ses_demo",
          callID: "call_2",
          args: { filePath: "/workspace/demo/questions.md" },
        },
        output: {
          title: "写出缺口清单",
          output: "形成决策：先输出缺口清单，不进入正式写作。",
          metadata: {},
        },
      },
    })
    pendingJobs.enqueue({
      sessionID: "ses_demo",
      kind: "session-idle",
      payload: { sessionID: "ses_demo" },
    })
    database.close()

    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    await waitForSummary(databasePath, 1)

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })
    const search = await worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "资格条件",
      limit: 5,
    })

    expect(search.results.length).toBeGreaterThan(0)
  })
})

async function waitForSummary(databasePath: string, minimumCount: number) {
  const deadline = Date.now() + 1_000

  while (Date.now() < deadline) {
    const db = new Database(databasePath, { readonly: true })
    try {
      const row = db
        .query("SELECT COUNT(*) as count FROM summaries")
        .get() as { count: number } | undefined

      if ((row?.count ?? 0) >= minimumCount) {
        return
      }
    } finally {
      db.close()
    }

    await Bun.sleep(20)
  }

  throw new Error(`Timed out waiting for ${minimumCount} summaries in ${databasePath}`)
}
