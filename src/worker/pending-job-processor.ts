import type { MemoryWorkerService } from "../services/memory-worker-service.js"
import { log as defaultLog } from "../services/logger.js"
import type { SessionJobScheduler } from "./session-job-scheduler.js"
import type {
  PendingJobKind,
  PendingJobRecord,
  PendingJobStore,
} from "./pending-jobs.js"

type JobWorker = Pick<
  MemoryWorkerService,
  "captureRequestAnchorFromMessage" | "captureObservationFromToolCall" | "handleSessionIdle"
>

export function createPendingJobProcessor(input: {
  store: PendingJobStore
  scheduler: SessionJobScheduler
  worker: JobWorker
  log?: typeof defaultLog
}) {
  const log = input.log ?? defaultLog

  async function processSessionJobs(sessionID: string) {
    while (true) {
      const job = input.store.claimNext(sessionID)
      if (!job) {
        return
      }

      logQueueState(log, input.store, "memory queue started job", {
        sessionID,
        jobID: job.id,
        kind: job.kind,
        attemptCount: job.attemptCount,
      })

      try {
        await executeJob(job, input.worker)
        input.store.complete(job.id)
        logQueueState(log, input.store, "memory queue completed job", {
          sessionID,
          jobID: job.id,
          kind: job.kind,
        })
      } catch (error) {
        const failureStatus = input.store.recordFailure(job.id, normalizeError(error))
        logQueueState(log, input.store, "memory queue failed job", {
          sessionID,
          jobID: job.id,
          kind: job.kind,
          failureStatus,
          error: normalizeError(error),
        })
        if (failureStatus === "pending") {
          return
        }
      }
    }
  }

  function scheduleSession(sessionID: string) {
    input.scheduler.enqueue(sessionID, async () => {
      await processSessionJobs(sessionID)
    })
  }

  return {
    enqueueRequestAnchor(payload: Parameters<JobWorker["captureRequestAnchorFromMessage"]>[0]) {
      const jobID = input.store.enqueue({
        sessionID: payload.sessionID,
        kind: "request-anchor",
        payload,
      })
      logQueueState(log, input.store, "memory queue enqueued job", {
        sessionID: payload.sessionID,
        jobID,
        kind: "request-anchor",
      })
      scheduleSession(payload.sessionID)
    },

    enqueueObservation(
      toolInput: Parameters<JobWorker["captureObservationFromToolCall"]>[0],
      output: Parameters<JobWorker["captureObservationFromToolCall"]>[1],
    ) {
      const jobID = input.store.enqueue({
        sessionID: toolInput.sessionID,
        kind: "observation",
        payload: { toolInput, output },
      })
      logQueueState(log, input.store, "memory queue enqueued job", {
        sessionID: toolInput.sessionID,
        jobID,
        kind: "observation",
      })
      scheduleSession(toolInput.sessionID)
    },

    enqueueIdleSummary(payload: Parameters<JobWorker["handleSessionIdle"]>[0]) {
      const jobID = input.store.enqueue({
        sessionID: payload,
        kind: "session-idle",
        payload: { sessionID: payload },
      })
      logQueueState(log, input.store, "memory queue enqueued job", {
        sessionID: payload,
        jobID,
        kind: "session-idle",
      })
      scheduleSession(payload)
    },

    async processSessionJobs(sessionID: string) {
      await input.scheduler.run(sessionID, async () => {
        await processSessionJobs(sessionID)
      })
    },

    resumePendingJobs() {
      const resetCount = input.store.resetProcessingToPending()
      log("memory queue resumed pending jobs", {
        resetProcessingCount: resetCount,
        pendingSessions: input.store.listSessionIDsWithPendingJobs().length,
      })
      for (const sessionID of input.store.listSessionIDsWithPendingJobs()) {
        scheduleSession(sessionID)
      }
      return resetCount
    },
  }
}

async function executeJob(job: PendingJobRecord, worker: JobWorker) {
  switch (job.kind) {
    case "request-anchor":
      await worker.captureRequestAnchorFromMessage(job.payload)
      return
    case "observation":
      await worker.captureObservationFromToolCall(job.payload.toolInput, job.payload.output)
      return
    case "session-idle":
      await worker.handleSessionIdle(job.payload.sessionID)
      return
    default:
      assertNever(job)
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function logQueueState(
  log: typeof defaultLog,
  store: Pick<PendingJobStore, "getQueueStats">,
  message: string,
  metadata: Record<string, unknown>,
) {
  const counts = store.getQueueStats()
  log(message, {
    ...metadata,
    counts,
    queueDepth: counts.pending + counts.processing,
    isProcessing: counts.pending > 0 || counts.processing > 0,
  })
}

function assertNever(value: never): never {
  throw new Error(`Unsupported pending job: ${JSON.stringify(value)}`)
}
