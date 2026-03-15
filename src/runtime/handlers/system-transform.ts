import { buildSystemContinuityContext as defaultBuildSystemContinuityContext } from "../injection/system-context.js"
import type { ContinuityWorkerService } from "../../services/continuity-worker-service.js"

type BuildSystemContinuityContext = typeof defaultBuildSystemContinuityContext

export interface SystemTransformHandlerDependencies {
  worker: Pick<ContinuityWorkerService, "selectInjectionRecords">
  maxSummaries: number
  maxObservations: number
  maxChars: number
  buildSystemContinuityContext?: BuildSystemContinuityContext
}

export function createSystemTransformHandler(input: SystemTransformHandlerDependencies) {
  const buildSystemContinuityContext =
    input.buildSystemContinuityContext ?? defaultBuildSystemContinuityContext

  return async (
    transformInput: { sessionID?: string },
    output: { system: string[] },
  ) => {
    const selected = input.worker.selectInjectionRecords({
      sessionID: transformInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
    })

    const system = buildSystemContinuityContext({
      scope: selected.scope,
      summaries: selected.summaries,
      observations: selected.observations,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
      maxChars: input.maxChars,
    })

    if (system.length > 0) {
      output.system.unshift(...system)
    }
  }
}
