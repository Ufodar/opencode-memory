import type { MemoryWorkerService } from "../services/memory-worker-service.js"
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
}) {
  async function processSessionJobs(sessionID: string) {
    while (true) {
      const job = input.store.claimNext(sessionID)
      if (!job) {
        return
      }

      try {
        await executeJob(job, input.worker)
        input.store.complete(job.id)
      } catch (error) {
        input.store.releaseForRetry(job.id, normalizeError(error))
        return
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
      input.store.enqueue({
        sessionID: payload.sessionID,
        kind: "request-anchor",
        payload,
      })
      scheduleSession(payload.sessionID)
    },

    enqueueObservation(
      toolInput: Parameters<JobWorker["captureObservationFromToolCall"]>[0],
      output: Parameters<JobWorker["captureObservationFromToolCall"]>[1],
    ) {
      input.store.enqueue({
        sessionID: toolInput.sessionID,
        kind: "observation",
        payload: { toolInput, output },
      })
      scheduleSession(toolInput.sessionID)
    },

    enqueueIdleSummary(payload: Parameters<JobWorker["handleSessionIdle"]>[0]) {
      input.store.enqueue({
        sessionID: payload,
        kind: "session-idle",
        payload: { sessionID: payload },
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

function assertNever(value: never): never {
  throw new Error(`Unsupported pending job: ${JSON.stringify(value)}`)
}
