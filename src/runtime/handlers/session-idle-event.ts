import { log as defaultLog } from "../../services/logger.js"
import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

type IdleEventLogger = typeof defaultLog

export interface SessionIdleEventHandlerDependencies {
  worker: Pick<MemoryWorkerService, "handleSessionIdle">
  log?: IdleEventLogger
}

export function createSessionIdleEventHandler(
  input: SessionIdleEventHandlerDependencies,
) {
  const log = input.log ?? defaultLog

  return async ({ event }: { event: { type: string; properties: Record<string, unknown> } }) => {
    if (event.type !== "session.idle") {
      return
    }

    const sessionID = event.properties.sessionID
    if (typeof sessionID !== "string" || sessionID.length === 0) {
      return
    }

    const result = await input.worker.handleSessionIdle(sessionID)

    if (result.status === "busy") {
      log("session.idle skipped because summary is already in flight", { sessionID })
      return
    }

    if (result.status === "missing-request") {
      log("session.idle without pending request anchor", { sessionID })
      return
    }

    if (result.status === "no-op") {
      log("session.idle without aggregatable observations", {
        sessionID,
        requestAnchorID: result.requestAnchorID,
      })
      return
    }

    log("captured summary", { id: result.summaryID, sessionID })
  }
}
