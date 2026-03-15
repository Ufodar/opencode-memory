import { buildCompactionContinuityContext as defaultBuildCompactionContinuityContext } from "../injection/compaction-context.js"
import type { ContinuityWorkerService } from "../../services/continuity-worker-service.js"

type BuildCompactionContinuityContext = typeof defaultBuildCompactionContinuityContext

export interface SessionCompactingHandlerDependencies {
  worker: Pick<ContinuityWorkerService, "selectInjectionRecords">
  maxSummaries: number
  maxObservations: number
  maxChars: number
  buildCompactionContinuityContext?: BuildCompactionContinuityContext
}

export function createSessionCompactingHandler(input: SessionCompactingHandlerDependencies) {
  const buildCompactionContinuityContext =
    input.buildCompactionContinuityContext ?? defaultBuildCompactionContinuityContext

  return async (
    compactingInput: { sessionID?: string },
    output: { context: string[] },
  ) => {
    const selected = input.worker.selectInjectionRecords({
      sessionID: compactingInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
    })

    const context = buildCompactionContinuityContext({
      summaries: selected.summaries,
      observations: selected.observations,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
      maxChars: input.maxChars,
    })

    if (context.length > 0) {
      output.context.push(context.join("\n"))
    }
  }
}
