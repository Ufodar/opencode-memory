import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  checkMemoryWorkerHealth,
  createMemoryWorkerHttpClient,
  getMemoryWorkerHealth,
  openMemoryWorkerEventStream,
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

  test("flushes active sessions before stopping the worker", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_shutdown",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    await worker.captureObservationFromToolCall(
      {
        tool: "read",
        sessionID: "ses_shutdown",
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

    await worker.captureObservationFromToolCall(
      {
        tool: "write",
        sessionID: "ses_shutdown",
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

    await waitForActiveSessions(worker, ["ses_shutdown"])
    await server.stop()
    await waitForSummary(databasePath, 1)

    const database = new SQLiteMemoryDatabase(databasePath)
    try {
      const pendingJobs = new PendingJobRepository(database.handle)
      expect(pendingJobs.getQueueStats()).toEqual({
        pending: 0,
        processing: 0,
        failed: 0,
      })
    } finally {
      database.close()
    }
  })

  test("supports explicit session completion over http", async () => {
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

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    await worker.captureObservationFromToolCall(
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

    await worker.captureObservationFromToolCall(
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

    const result = await worker.completeSession("ses_demo")

    expect(result.status).toBe("completed")
    expect(result.sessionID).toBe("ses_demo")
    expect(result.summaryStatus).toBe("summarized")

    await waitForSummary(databasePath, 1)

    const queueStatus = await worker.getQueueStatus({
      limit: 5,
    })

    expect(queueStatus.workerStatus?.lastEvent?.type).toBe("session-complete")
    expect(queueStatus.workerStatus?.lastEvent?.sessionID).toBe("ses_demo")
    expect(queueStatus.workerStatus?.activeSessionIDs).toEqual([])
    expect(queueStatus.workerStatus?.lastSessionCompletion).toMatchObject({
      sessionID: "ses_demo",
      summaryStatus: "summarized",
      requestAnchorID: result.requestAnchorID,
      summaryID: result.summaryID,
      checkpointObservationAt: result.checkpointObservationAt,
    })
  })

  test("tracks active sessions inside the worker status snapshot", async () => {
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

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    await waitForActiveSessions(worker, ["ses_demo"])

    await worker.completeSession("ses_demo")

    await waitForActiveSessions(worker, [])
  })

  test("does not revive active sessions from a stale worker status snapshot", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const statusPath = path.join(root, "worker-status.json")
    await writeFile(
      statusPath,
      JSON.stringify(
        {
          updatedAt: 456,
          isProcessing: false,
          queueDepth: 0,
          counts: { pending: 0, processing: 0, failed: 0 },
          activeSessionIDs: ["ses_stale"],
          lastEvent: {
            type: "worker-started",
          },
          lastSessionCompletion: {
            sessionID: "ses_prev",
            completedAt: 455,
            summaryStatus: "summarized",
            requestAnchorID: "req_1",
            summaryID: "sum_1",
            checkpointObservationAt: 123,
          },
        },
        null,
        2,
      ),
    )

    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
      statusPath,
    })
    cleanupTasks.push(() => server.stop())

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    const queueStatus = await worker.getQueueStatus({
      limit: 5,
    })

    expect(queueStatus.workerStatus?.activeSessionIDs).toEqual([])
    expect(queueStatus.workerStatus?.lastSessionCompletion).toMatchObject({
      sessionID: "ses_prev",
      summaryStatus: "summarized",
      requestAnchorID: "req_1",
      summaryID: "sum_1",
      checkpointObservationAt: 123,
    })
  })

  test("reaps a stale active session by completing it inside the worker", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
      activeSessionMaxIdleMs: 50,
      activeSessionReapIntervalMs: 10,
    })
    cleanupTasks.push(() => server.stop())

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_stale",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })
    await worker.captureObservationFromToolCall(
      {
        tool: "read",
        sessionID: "ses_stale",
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
    await worker.captureObservationFromToolCall(
      {
        tool: "write",
        sessionID: "ses_stale",
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

    await waitForActiveSessions(worker, ["ses_stale"])
    await waitForSummary(databasePath, 1)
    await waitForActiveSessions(worker, [])

    const queueStatus = await worker.getQueueStatus({
      limit: 5,
    })

    expect(queueStatus.workerStatus?.lastEvent?.type).toBe("session-complete")
    expect(queueStatus.workerStatus?.lastSessionCompletion?.sessionID).toBe("ses_stale")
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

  test("returns a live snapshot for new stream consumers", async () => {
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

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })
    await worker.captureObservationFromToolCall(
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
    await worker.captureObservationFromToolCall(
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
    await worker.handleSessionIdle("ses_demo")
    await waitForSummary(databasePath, 1)

    const snapshot = await worker.getLiveSnapshot({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
      queueLimit: 5,
    })

    expect(snapshot.scope).toBe("session")
    expect(snapshot.summaries.length).toBeGreaterThan(0)
    expect(snapshot.queue.workerStatus).not.toBeNull()
    expect(snapshot.observations.length).toBeGreaterThanOrEqual(0)
  })

  test("streams processing status updates over sse", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    const stream = await openMemoryWorkerEventStream({
      baseUrl: server.baseUrl,
    })

    const connected = await stream.readNext()
    expect(connected.type).toBe("connected")

    const initialStatus = await waitForSseEvent(
      stream,
      (event) => event.type === "processing_status",
    )
    expect(initialStatus.queueDepth).toBe(0)
    expect(initialStatus.isProcessing).toBe(false)

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    const nextStatus = await waitForSseEvent(
      stream,
      (event) =>
        event.type === "processing_status" &&
        event.updatedAt > initialStatus.updatedAt,
    )

    expect(["enqueue", "start", "complete"]).toContain(nextStatus.lastEvent?.type)

    await stream.close()
  })

  test("streams new observations and summaries over sse", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    const stream = await openMemoryWorkerEventStream({
      baseUrl: server.baseUrl,
    })

    await stream.readNext()
    await waitForSseEvent(stream, (event) => event.type === "processing_status")

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    await worker.captureObservationFromToolCall(
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

    const observationEvent = await waitForSseEvent(
      stream,
      (event) => event.type === "new_observation",
    )
    expect(observationEvent.observation).toBeDefined()
    expect(
      (observationEvent.observation as { sessionID?: string }).sessionID,
    ).toBe("ses_demo")

    await worker.captureObservationFromToolCall(
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
    await worker.handleSessionIdle("ses_demo")

    const summaryEvent = await waitForSseEvent(
      stream,
      (event) => event.type === "new_summary",
      2_000,
    )
    expect(summaryEvent.summary).toBeDefined()
    expect((summaryEvent.summary as { requestSummary?: string }).requestSummary).toContain(
      "第3章资格条件",
    )

    await stream.close()
  })

  test("keeps the stream alive after the initial open timeout window", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
    })
    cleanupTasks.push(() => server.stop())

    const stream = await openMemoryWorkerEventStream({
      baseUrl: server.baseUrl,
      requestTimeoutMs: 25,
    })

    await stream.readNext()
    await waitForSseEvent(stream, (event) => event.type === "processing_status")

    await Bun.sleep(60)

    const worker = createMemoryWorkerHttpClient({
      baseUrl: server.baseUrl,
    })

    await worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    const nextStatus = await waitForSseEvent(
      stream,
      (event) =>
        event.type === "processing_status" &&
        ["enqueue", "start", "complete"].includes(String(event.lastEvent?.type ?? "")),
      1_000,
    )

    expect(nextStatus.type).toBe("processing_status")

    await stream.close()
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

  test("shuts itself down after idle timeout and removes the registry record", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-worker-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const databasePath = path.join(root, "memory.sqlite")
    const registryPath = path.join(root, "worker-registry.json")
    const server = await startMemoryWorkerServer({
      port: 0,
      projectPath: "/workspace/demo",
      databasePath,
      registryPath,
      idleShutdownMs: 50,
    })
    cleanupTasks.push(() => server.stop())

    const initialRecord = readWorkerRegistryRecord({
      registryPath,
      projectPath: "/workspace/demo",
      databasePath,
    })
    expect(initialRecord).not.toBeUndefined()

    await waitForWorkerShutdown(server.baseUrl, 1_000)

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

async function readNextSseEvent(
  stream: Awaited<ReturnType<typeof openMemoryWorkerEventStream>>,
  timeoutMs = 1_000,
): Promise<Record<string, unknown>> {
  return (await stream.readNext(timeoutMs)) as Record<string, unknown>
}

async function waitForSseEvent(
  stream: Awaited<ReturnType<typeof openMemoryWorkerEventStream>>,
  match: (event: Record<string, unknown>) => boolean,
  timeoutMs = 1_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const event = await readNextSseEvent(stream, deadline - Date.now())
    if (match(event)) {
      return event
    }
  }

  throw new Error(`Timed out waiting for matching SSE event after ${timeoutMs}ms`)
}

async function waitForWorkerShutdown(baseUrl: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const healthy = await checkMemoryWorkerHealth({
      baseUrl,
      requestTimeoutMs: 50,
    })

    if (!healthy) {
      return
    }

    await Bun.sleep(25)
  }

  throw new Error(`Timed out waiting for worker shutdown: ${baseUrl}`)
}

async function waitForActiveSessions(
  worker: ReturnType<typeof createMemoryWorkerHttpClient>,
  expected: string[],
  timeoutMs = 1_000,
) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const queueStatus = await worker.getQueueStatus({
      limit: 5,
    })

    const activeSessions = queueStatus.workerStatus?.activeSessionIDs ?? []
    if (JSON.stringify(activeSessions) === JSON.stringify(expected)) {
      return
    }

    await Bun.sleep(20)
  }

  throw new Error(`Timed out waiting for active sessions: ${JSON.stringify(expected)}`)
}
