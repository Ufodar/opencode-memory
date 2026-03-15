import { createSessionReentryGuard } from "../runtime/hooks/idle-summary-guard.js"
import { generateModelSummary } from "../services/ai/model-summary.js"
import { log } from "../services/logger.js"
import { createMemoryWorkerService } from "../services/memory-worker-service.js"
import { SQLiteMemoryStore } from "../storage/sqlite/memory-store.js"
import { getOpencodeMemoryVersion } from "../version.js"
import {
  removeWorkerRegistryRecord,
  writeWorkerRegistryRecord,
} from "./registry.js"
import { createPendingJobProcessor } from "./pending-job-processor.js"
import { createSessionJobScheduler } from "./session-job-scheduler.js"
import { createMemoryWorkerStatusSnapshotStore } from "./worker-status-snapshot.js"
import type { MemoryWorkerStatusSnapshot } from "../memory/contracts.js"
import type {
  BuildCompactionContextRequest,
  BuildCompactionContextResponse,
  BuildSystemContextRequest,
  BuildSystemContextResponse,
  CaptureObservationRequest,
  CaptureObservationResponse,
  CaptureRequestAnchorRequest,
  CaptureRequestAnchorResponse,
  IdleSummaryRequest,
  IdleSummaryResponse,
  MemoryDetailsRequest,
  MemoryDetailsResponse,
  QueueRetryRequest,
  QueueRetryResponse,
  QueueStatusRequest,
  QueueStatusResponse,
  SearchMemoryRequest,
  SearchMemoryResponse,
  SelectInjectionRequest,
  SelectInjectionResponse,
  TimelineMemoryRequest,
  TimelineMemoryResponse,
  WorkerAcceptedResponse,
} from "./protocol.js"

export interface MemoryWorkerServerHandle {
  port: number
  baseUrl: string
  stop(): Promise<void>
}

export async function startMemoryWorkerServer(input: {
  port: number
  projectPath: string
  databasePath: string
  registryPath?: string
  statusPath?: string
  heartbeatIntervalMs?: number
}): Promise<MemoryWorkerServerHandle> {
  const store = new SQLiteMemoryStore(input.databasePath)
  const statusStore = input.statusPath
    ? createMemoryWorkerStatusSnapshotStore(input.statusPath)
    : null
  const idleSummaryGuard = createSessionReentryGuard()
  const sessionJobs = createSessionJobScheduler()
  const worker = createMemoryWorkerService({
    projectPath: input.projectPath,
    store,
    idleSummaryGuard,
    generateModelSummary,
    readWorkerStatus: () => statusStore?.read() ?? null,
  })
  const pendingJobs = createPendingJobProcessor({
    store: {
      enqueue(input) {
        return store.enqueuePendingJob(input)
      },
      claimNext(sessionID) {
        return store.claimNextPendingJob(sessionID)
      },
      complete(id) {
        store.completePendingJob(id)
      },
      recordFailure(id, error) {
        return store.recordPendingJobFailure(id, error)
      },
      listSessionIDsWithPendingJobs() {
        return store.listSessionIDsWithPendingJobs()
      },
      resetProcessingToPending() {
        return store.resetProcessingPendingJobs()
      },
      getQueueStats() {
        return store.getQueueStats()
      },
      listFailedJobs(limit) {
        return store.listFailedJobs(limit)
      },
      listProcessingJobs(limit) {
        return store.listProcessingJobs(limit)
      },
      retryJob(id) {
        return store.retryJob(id)
      },
    },
    scheduler: sessionJobs,
    worker,
    publishWorkerStatus(snapshot) {
      statusStore?.write(snapshot)
    },
  })
  let stopped = false
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined

  const stopServer = async () => {
    if (stopped) {
      return
    }

    stopped = true
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = undefined
    }
    if (input.registryPath) {
      removeWorkerRegistryRecord({
        registryPath: input.registryPath,
        projectPath: input.projectPath,
        databasePath: input.databasePath,
      })
    }
    writeWorkerStatusSnapshot(statusStore, store.getQueueStats(), {
      type: "worker-stopped",
    })
    server.stop(true)
    store.close()
  }

  const server = Bun.serve({
    port: input.port,
    idleTimeout: 30,
    fetch: async (request) => {
      const url = new URL(request.url)

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, version: getOpencodeMemoryVersion() })
      }

      if (request.method === "POST" && url.pathname === "/shutdown") {
        setTimeout(() => {
          void stopServer()
        }, 10)
        return json({ ok: true })
      }

      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 })
      }

      try {
        switch (url.pathname) {
          case "/enqueue/request-anchor": {
            const payload = await readJson<CaptureRequestAnchorRequest>(request)
            pendingJobs.enqueueRequestAnchor(payload)
            return json({ accepted: true } satisfies WorkerAcceptedResponse)
          }
          case "/enqueue/observation": {
            const payload = await readJson<CaptureObservationRequest>(request)
            pendingJobs.enqueueObservation(payload.toolInput, payload.output)
            return json({ accepted: true } satisfies WorkerAcceptedResponse)
          }
          case "/enqueue/session-idle": {
            const payload = await readJson<IdleSummaryRequest>(request)
            pendingJobs.enqueueIdleSummary(payload.sessionID)
            return json({ accepted: true } satisfies WorkerAcceptedResponse)
          }
          case "/capture/request-anchor": {
            const payload = await readJson<CaptureRequestAnchorRequest>(request)
            return json(
              await sessionJobs.run(
                payload.sessionID,
                async () =>
                  await worker.captureRequestAnchorFromMessage(
                    payload,
                  ) satisfies CaptureRequestAnchorResponse,
              ),
            )
          }
          case "/capture/observation": {
            const payload = await readJson<CaptureObservationRequest>(request)
            return json(
              await sessionJobs.run(
                payload.toolInput.sessionID,
                async () =>
                  await worker.captureObservationFromToolCall(
                    payload.toolInput,
                    payload.output,
                  ) satisfies CaptureObservationResponse,
              ) satisfies CaptureObservationResponse,
            )
          }
          case "/session/idle": {
            const payload = await readJson<IdleSummaryRequest>(request)
            return json(
              await sessionJobs.run(
                payload.sessionID,
                async () => await worker.handleSessionIdle(payload.sessionID),
              ) satisfies IdleSummaryResponse,
            )
          }
          case "/injection/select": {
            const payload = await readJson<SelectInjectionRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.selectInjectionRecords(payload)) satisfies SelectInjectionResponse)
          }
          case "/injection/system-context": {
            const payload = await readJson<BuildSystemContextRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.buildSystemContext(payload)) satisfies BuildSystemContextResponse)
          }
          case "/injection/compaction-context": {
            const payload = await readJson<BuildCompactionContextRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.buildCompactionContext(payload)) satisfies BuildCompactionContextResponse)
          }
          case "/search": {
            const payload = await readJson<SearchMemoryRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.searchMemoryRecords(payload)) satisfies SearchMemoryResponse)
          }
          case "/timeline": {
            const payload = await readJson<TimelineMemoryRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.getMemoryTimeline(payload)) satisfies TimelineMemoryResponse)
          }
          case "/details":
            return json(
              await worker.getMemoryDetails(
                (await readJson<MemoryDetailsRequest>(request)).ids,
              ) satisfies MemoryDetailsResponse,
            )
          case "/queue/status": {
            const payload = await readJson<QueueStatusRequest>(request)
            return json(await worker.getQueueStatus(payload) satisfies QueueStatusResponse)
          }
          case "/queue/retry": {
            const payload = await readJson<QueueRetryRequest>(request)
            return json(await worker.retryQueueJob(payload.jobID) satisfies QueueRetryResponse)
          }
          default:
            return json({ error: "Not found" }, { status: 404 })
        }
      } catch (error) {
        log("memory worker request failed", {
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        })
        return json(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    },
  })

  const port = server.port
  if (typeof port !== "number") {
    await stopServer()
    throw new Error("Memory worker server did not expose a port")
  }

  if (input.registryPath) {
    const writeHeartbeat = () => {
      if (!process.pid) {
        return
      }

      writeWorkerRegistryRecord({
        registryPath: input.registryPath!,
        projectPath: input.projectPath,
        databasePath: input.databasePath,
        port,
        pid: process.pid,
      })
    }

    writeHeartbeat()
    heartbeatTimer = setInterval(writeHeartbeat, input.heartbeatIntervalMs ?? 5_000)
  }

  writeWorkerStatusSnapshot(statusStore, store.getQueueStats(), {
    type: "worker-started",
  })
  pendingJobs.resumePendingJobs()

  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      await stopServer()
    },
  }
}

function writeWorkerStatusSnapshot(
  statusStore: ReturnType<typeof createMemoryWorkerStatusSnapshotStore> | null,
  counts: MemoryWorkerStatusSnapshot["counts"],
  lastEvent: MemoryWorkerStatusSnapshot["lastEvent"],
) {
  if (!statusStore) {
    return
  }

  statusStore.write({
    updatedAt: Date.now(),
    counts,
    queueDepth: counts.pending + counts.processing,
    isProcessing: counts.pending > 0 || counts.processing > 0,
    lastEvent,
  })
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

function json(value: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
}

async function runSessionScoped<T>(
  sessionID: string | undefined,
  scheduler: ReturnType<typeof createSessionJobScheduler>,
  task: () => Promise<T>,
): Promise<T> {
  if (!sessionID) {
    return task()
  }

  return scheduler.run(sessionID, task)
}
