import type { ContinuityIdleSummaryStore } from "../../continuity/contracts.js"
import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import type { ModelSummaryResult } from "../../services/ai/model-summary.js"
import { log as defaultLog } from "../../services/logger.js"
import { runIdleSummaryPipeline as defaultRunIdleSummaryPipeline } from "../pipelines/idle-summary-pipeline.js"

type IdleSummaryPipeline = typeof defaultRunIdleSummaryPipeline
type IdleEventLogger = typeof defaultLog

export interface SessionIdleEventHandlerDependencies {
  projectPath: string
  store: ContinuityIdleSummaryStore
  idleSummaryGuard: {
    run<T>(sessionID: string, task: () => Promise<T>): Promise<{ ran: boolean; result?: T }>
  }
  generateModelSummary?: (input: {
    request: RequestAnchorRecord
    observations: ObservationRecord[]
  }) => Promise<ModelSummaryResult | null>
  runIdleSummaryPipeline?: IdleSummaryPipeline
  log?: IdleEventLogger
}

export function createSessionIdleEventHandler(
  input: SessionIdleEventHandlerDependencies,
) {
  const runIdleSummaryPipeline = input.runIdleSummaryPipeline ?? defaultRunIdleSummaryPipeline
  const log = input.log ?? defaultLog

  return async ({ event }: { event: { type: string; properties: Record<string, unknown> } }) => {
    if (event.type !== "session.idle") {
      return
    }

    const sessionID = event.properties.sessionID
    if (typeof sessionID !== "string" || sessionID.length === 0) {
      return
    }

    const guardResult = await input.idleSummaryGuard.run(sessionID, async () => {
      const result = await runIdleSummaryPipeline({
        projectPath: input.projectPath,
        sessionID,
        store: input.store,
        generateModelSummary: input.generateModelSummary,
      })

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
    })

    if (!guardResult.ran) {
      log("session.idle skipped because summary is already in flight", { sessionID })
    }
  }
}
