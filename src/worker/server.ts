import { createSessionReentryGuard } from "../runtime/hooks/idle-summary-guard.js"
import { generateModelObservation } from "../services/ai/model-observation.js"
import { generateModelSummary } from "../services/ai/model-summary.js"
import { createEmbeddingClient } from "../services/ai/embedding-client.js"
import { getEmbeddingConfig } from "../services/ai/embedding-config.js"
import { log } from "../services/logger.js"
import { createMemoryWorkerService } from "../services/memory-worker-service.js"
import { createStoredSemanticMemorySearch } from "../memory/vector/search-service.js"
import { SQLiteMemoryStore } from "../storage/sqlite/memory-store.js"
import { SQLiteMemoryVectorRepository } from "../storage/sqlite/vector-repository.js"
import { getOpencodeMemoryVersion } from "../version.js"
import {
  removeWorkerRegistryRecord,
  writeWorkerRegistryRecord,
} from "./registry.js"
import { createPendingJobProcessor } from "./pending-job-processor.js"
import { createSessionJobScheduler } from "./session-job-scheduler.js"
import { createMemoryWorkerStreamBroadcaster } from "./stream-broadcaster.js"
import { createMemoryWorkerStatusSnapshotStore } from "./worker-status-snapshot.js"
import { createActiveSessionRegistry } from "./active-session-registry.js"
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
  SessionCompleteRequest,
  SessionCompleteResponse,
  MemoryWorkerSnapshotRequest,
  MemoryWorkerSnapshotResponse,
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
  idleShutdownMs?: number
  activeSessionMaxIdleMs?: number
  activeSessionReapIntervalMs?: number
}): Promise<MemoryWorkerServerHandle> {
  const store = new SQLiteMemoryStore(input.databasePath)
  const embeddingConfig = getEmbeddingConfig()
  const embeddingClient = embeddingConfig ? createEmbeddingClient(embeddingConfig) : null
  const vectorRepository = new SQLiteMemoryVectorRepository(store.getDatabaseHandle())
  const semanticMemorySearch =
    embeddingConfig && embeddingClient
      ? createStoredSemanticMemorySearch({
          repository: vectorRepository,
          dimensions: embeddingConfig.dimensions,
          backend: embeddingConfig.backend,
          embedQuery: (query) => embeddingClient.embed(query),
          logFailure: log,
        })
      : null
  const statusStore = input.statusPath
    ? createMemoryWorkerStatusSnapshotStore(input.statusPath)
    : null
  const initialStatusSnapshot = statusStore?.read() ?? null
  // Active sessions are runtime state. On restart, they should be rebuilt from
  // pending jobs and new capture events rather than revived from a stale status snapshot.
  const activeSessions = createActiveSessionRegistry([])
  let lastWorkerStatusSnapshot: MemoryWorkerStatusSnapshot | null = null
  const idleSummaryGuard = createSessionReentryGuard()
  const sessionJobs = createSessionJobScheduler()
  const streamBroadcaster = createMemoryWorkerStreamBroadcaster({
    getCurrentStatus: () =>
      getCurrentWorkerStatusSnapshot({
        statusStore,
        store,
        activeSessionIDs: activeSessions.list(),
        lastSnapshot: lastWorkerStatusSnapshot,
      }),
  })
  const worker = createMemoryWorkerService({
    projectPath: input.projectPath,
    store,
    idleSummaryGuard,
    generateModelObservation,
    generateModelSummary,
    readWorkerStatus: () => lastWorkerStatusSnapshot ?? initialStatusSnapshot,
    async onObservationCaptured(observation) {
      streamBroadcaster.broadcastObservation(observation)
      await semanticMemorySearch?.indexObservation(observation)
    },
    async onSummaryCaptured(summaryInput) {
      streamBroadcaster.broadcastSummary(summaryInput.detail)
      await semanticMemorySearch?.indexSummary({
        detail: summaryInput.detail,
        projectPath: summaryInput.summary.projectPath,
        sessionID: summaryInput.summary.sessionID,
        requestSummary: summaryInput.summary.requestSummary,
      })
    },
    searchSemanticMemoryRecords: semanticMemorySearch
      ? async (searchInput) =>
          (
            await semanticMemorySearch.search({
              projectPath: searchInput.projectPath,
              sessionID: searchInput.sessionID,
              query: searchInput.query,
              limit: searchInput.limit,
            })
          ).results
      : undefined,
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
      hasOutstandingJobs(sessionID) {
        return store.hasOutstandingPendingJobs(sessionID)
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
    onSessionQueued(sessionID) {
      activeSessions.touch(sessionID)
    },
    getActiveSessionIDs() {
      return activeSessions.list()
    },
    publishWorkerStatus(snapshot) {
      const mergedSnapshot: MemoryWorkerStatusSnapshot = {
        ...snapshot,
        activeSessionIDs: activeSessions.list(),
        lastSessionCompletion:
          snapshot.lastSessionCompletion ??
          lastWorkerStatusSnapshot?.lastSessionCompletion ??
          statusStore?.read()?.lastSessionCompletion,
      }
      lastWorkerStatusSnapshot = mergedSnapshot
      statusStore?.write(mergedSnapshot)
      streamBroadcaster.broadcastProcessingStatus(mergedSnapshot)
    },
  })
  let stopped = false
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined
  let idleShutdownTimer: ReturnType<typeof setInterval> | undefined
  let activeSessionReapTimer: ReturnType<typeof setInterval> | undefined
  let lastActivityAt = Date.now()
  const reapingSessionIDs = new Set<string>()

  const completeActiveSession = async (sessionID: string) => {
    const response = await sessionJobs.run(sessionID, async () => {
      return await worker.completeSession(sessionID)
    })

    activeSessions.remove(sessionID)
    publishWorkerLifecycleEvent({
      statusStore,
      store,
      streamBroadcaster,
      activeSessionIDs: activeSessions.list(),
      onSnapshot(snapshot) {
        lastWorkerStatusSnapshot = snapshot
      },
      previousSnapshot: lastWorkerStatusSnapshot,
      lastEvent: {
        type: "session-complete",
        sessionID,
      },
      lastSessionCompletion: {
        sessionID,
        completedAt: Date.now(),
        summaryStatus: response.summaryStatus,
        requestAnchorID: response.requestAnchorID,
        summaryID: response.summaryID,
        checkpointObservationAt: response.checkpointObservationAt,
      },
    })
  }

  const stopServer = async () => {
    if (stopped) {
      return
    }

    stopped = true
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = undefined
    }
    if (idleShutdownTimer) {
      clearInterval(idleShutdownTimer)
      idleShutdownTimer = undefined
    }
    if (activeSessionReapTimer) {
      clearInterval(activeSessionReapTimer)
      activeSessionReapTimer = undefined
    }
    const activeSessionIDs = activeSessions.list()
    for (const sessionID of activeSessionIDs) {
      try {
        await completeActiveSession(sessionID)
      } catch (error) {
        log("memory worker shutdown flush failed", {
          sessionID,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    if (input.registryPath) {
      removeWorkerRegistryRecord({
        registryPath: input.registryPath,
        projectPath: input.projectPath,
        databasePath: input.databasePath,
      })
    }
    lastWorkerStatusSnapshot = writeWorkerStatusSnapshot(
      statusStore,
      store.getQueueStats(),
      activeSessions.list(),
      {
        type: "worker-stopped",
      },
      lastWorkerStatusSnapshot,
    )
    streamBroadcaster.close()
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

      lastActivityAt = Date.now()

      if (request.method === "GET" && url.pathname === "/stream") {
        return streamBroadcaster.createResponse(request)
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
            const response = await sessionJobs.run(
              payload.sessionID,
              async () =>
                await worker.captureRequestAnchorFromMessage(
                  payload,
                ) satisfies CaptureRequestAnchorResponse,
            )
            if (response) {
              activeSessions.touch(payload.sessionID)
            }
            return json(response)
          }
          case "/capture/observation": {
            const payload = await readJson<CaptureObservationRequest>(request)
            const response = await sessionJobs.run(
              payload.toolInput.sessionID,
              async () =>
                await worker.captureObservationFromToolCall(
                  payload.toolInput,
                  payload.output,
                ) satisfies CaptureObservationResponse,
            ) satisfies CaptureObservationResponse
            if (response) {
              activeSessions.touch(payload.toolInput.sessionID)
            }
            return json(response)
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
          case "/session/complete": {
            const payload = await readJson<SessionCompleteRequest>(request)
            const response = await sessionJobs.run(
              payload.sessionID,
              async () => await worker.completeSession(payload.sessionID),
            )
            activeSessions.remove(payload.sessionID)
            publishWorkerLifecycleEvent({
              statusStore,
              store,
              streamBroadcaster,
              activeSessionIDs: activeSessions.list(),
              onSnapshot(snapshot) {
                lastWorkerStatusSnapshot = snapshot
              },
              previousSnapshot: lastWorkerStatusSnapshot,
              lastEvent: {
                type: "session-complete",
                sessionID: payload.sessionID,
              },
              lastSessionCompletion: {
                sessionID: payload.sessionID,
                completedAt: Date.now(),
                summaryStatus: response.summaryStatus,
                requestAnchorID: response.requestAnchorID,
                summaryID: response.summaryID,
                checkpointObservationAt: response.checkpointObservationAt,
              },
            })
            return json(response satisfies SessionCompleteResponse)
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
          case "/stream/snapshot": {
            const payload = await readJson<MemoryWorkerSnapshotRequest>(request)
            return json(await runSessionScoped(payload.sessionID, sessionJobs, async () => worker.getLiveSnapshot(payload)) satisfies MemoryWorkerSnapshotResponse)
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

  if (input.idleShutdownMs && input.idleShutdownMs > 0) {
    const intervalMs = Math.max(25, Math.min(1_000, Math.floor(input.idleShutdownMs / 2)))
    idleShutdownTimer = setInterval(() => {
      if (stopped) {
        return
      }

      const counts = store.getQueueStats()
      if (counts.pending > 0 || counts.processing > 0) {
        return
      }

      if (streamBroadcaster.getClientCount() > 0) {
        return
      }

      if (Date.now() - lastActivityAt < input.idleShutdownMs!) {
        return
      }

      void stopServer()
    }, intervalMs)
  }

  if (input.activeSessionMaxIdleMs && input.activeSessionMaxIdleMs > 0) {
    const intervalMs =
      input.activeSessionReapIntervalMs && input.activeSessionReapIntervalMs > 0
        ? input.activeSessionReapIntervalMs
        : Math.max(100, Math.min(5_000, Math.floor(input.activeSessionMaxIdleMs / 2)))

    activeSessionReapTimer = setInterval(() => {
      if (stopped) {
        return
      }

      const staleSessionIDs = activeSessions.listStale(input.activeSessionMaxIdleMs!)
      for (const sessionID of staleSessionIDs) {
        if (reapingSessionIDs.has(sessionID)) {
          continue
        }
        if (store.hasOutstandingPendingJobs(sessionID)) {
          continue
        }
        if (sessionJobs.isBusy(sessionID)) {
          continue
        }

        reapingSessionIDs.add(sessionID)
        void completeActiveSession(sessionID)
          .finally(() => {
            reapingSessionIDs.delete(sessionID)
          })
      }
    }, intervalMs)
  }

  lastWorkerStatusSnapshot = writeWorkerStatusSnapshot(
    statusStore,
    store.getQueueStats(),
    activeSessions.list(),
    {
      type: "worker-started",
    },
    lastWorkerStatusSnapshot ?? initialStatusSnapshot,
  )
  streamBroadcaster.broadcastProcessingStatus(
    getCurrentWorkerStatusSnapshot({
      statusStore,
      store,
      activeSessionIDs: activeSessions.list(),
      lastSnapshot: lastWorkerStatusSnapshot,
    }),
  )
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
  activeSessionIDs: string[],
  lastEvent: MemoryWorkerStatusSnapshot["lastEvent"],
  previousSnapshot?: MemoryWorkerStatusSnapshot | null,
  lastSessionCompletion?: MemoryWorkerStatusSnapshot["lastSessionCompletion"],
) {
  const snapshot = {
    updatedAt: Date.now(),
    counts,
    queueDepth: counts.pending + counts.processing,
    isProcessing: counts.pending > 0 || counts.processing > 0,
    activeSessionIDs,
    lastEvent,
    lastSessionCompletion: lastSessionCompletion ?? previousSnapshot?.lastSessionCompletion,
  }

  statusStore?.write(snapshot)
  return snapshot
}

function publishWorkerLifecycleEvent(input: {
  statusStore: ReturnType<typeof createMemoryWorkerStatusSnapshotStore> | null
  store: Pick<SQLiteMemoryStore, "getQueueStats">
  streamBroadcaster: ReturnType<typeof createMemoryWorkerStreamBroadcaster>
  activeSessionIDs: string[]
  lastEvent: MemoryWorkerStatusSnapshot["lastEvent"]
  lastSessionCompletion?: MemoryWorkerStatusSnapshot["lastSessionCompletion"]
  previousSnapshot?: MemoryWorkerStatusSnapshot | null
  onSnapshot?: (snapshot: MemoryWorkerStatusSnapshot) => void
}) {
  const counts = input.store.getQueueStats()
  const snapshot = writeWorkerStatusSnapshot(
    input.statusStore,
    counts,
    input.activeSessionIDs,
    input.lastEvent,
    input.previousSnapshot,
    input.lastSessionCompletion,
  )
  input.onSnapshot?.(snapshot)
  input.streamBroadcaster.broadcastProcessingStatus(
    getCurrentWorkerStatusSnapshot({
      statusStore: input.statusStore,
      store: input.store,
      activeSessionIDs: input.activeSessionIDs,
      lastSnapshot: snapshot,
    }),
  )
}

function getCurrentWorkerStatusSnapshot(
  input: {
    statusStore: ReturnType<typeof createMemoryWorkerStatusSnapshotStore> | null
    store: Pick<SQLiteMemoryStore, "getQueueStats">
    activeSessionIDs?: string[]
    lastSnapshot: MemoryWorkerStatusSnapshot | null
  },
): MemoryWorkerStatusSnapshot {
  const currentSnapshot = input.lastSnapshot ?? input.statusStore?.read()
  if (currentSnapshot) {
    return currentSnapshot
  }

  const counts = input.store.getQueueStats()
  return {
    updatedAt: Date.now(),
    counts,
    queueDepth: counts.pending + counts.processing,
    isProcessing: counts.pending > 0 || counts.processing > 0,
    activeSessionIDs: input.activeSessionIDs ?? [],
    lastEvent: {
      type: "worker-started",
    },
    lastSessionCompletion: undefined,
  }
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
