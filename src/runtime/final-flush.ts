import { log as defaultLog } from "../services/logger.js"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

type FlushLogger = typeof defaultLog

const flushCallbacks = new Set<() => Promise<void>>()
let hooksRegistered = false
let flushInFlight: Promise<void> | null = null
let beforeExitKeepAlive: ReturnType<typeof setInterval> | null = null

export async function flushActiveMemorySessions(input: {
  worker: Pick<MemoryWorkerService, "completeSession" | "getQueueStatus">
  log?: FlushLogger
}) {
  const log = input.log ?? defaultLog
  const queueStatus = await input.worker.getQueueStatus({
    limit: 0,
  })
  const activeSessionIDs = queueStatus.workerStatus?.activeSessionIDs ?? []

  for (const sessionID of activeSessionIDs) {
    try {
      await input.worker.completeSession(sessionID)
      log("completed final memory flush", { sessionID })
    } catch (error) {
      log("final memory flush failed", {
        sessionID,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

export function registerMemoryFinalFlush(input: {
  worker: Pick<MemoryWorkerService, "completeSession" | "getQueueStatus">
  log?: FlushLogger
}) {
  flushCallbacks.add(() => flushActiveMemorySessions(input))

  if (hooksRegistered) {
    return
  }

  hooksRegistered = true

  const runAllFlushes = async () => {
    if (flushInFlight) {
      return flushInFlight
    }

    flushInFlight = Promise.allSettled(Array.from(flushCallbacks).map((callback) => callback())).then(
      () => {
        if (beforeExitKeepAlive) {
          clearInterval(beforeExitKeepAlive)
          beforeExitKeepAlive = null
        }
      },
    )

    return flushInFlight
  }

  process.once("beforeExit", () => {
    if (!beforeExitKeepAlive) {
      // Keep the event loop alive long enough for the async flush RPC to finish.
      beforeExitKeepAlive = setInterval(() => undefined, 25)
    }
    void runAllFlushes()
  })

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void runAllFlushes().finally(() => {
        process.exit(0)
      })
    })
  }
}
