import { buildSystemMemoryContext as defaultBuildSystemMemoryContext } from "../injection/system-context.js"
import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

type BuildSystemMemoryContext = typeof defaultBuildSystemMemoryContext

export interface SystemTransformHandlerDependencies {
  worker: Pick<MemoryWorkerService, "selectInjectionRecords">
  maxSummaries: number
  maxObservations: number
  maxChars: number
  buildSystemMemoryContext?: BuildSystemMemoryContext
}

export function createSystemTransformHandler(input: SystemTransformHandlerDependencies) {
  const buildSystemMemoryContext = input.buildSystemMemoryContext ?? defaultBuildSystemMemoryContext

  return async (
    transformInput: { sessionID?: string },
    output: { system: string[] },
  ) => {
    const selected = input.worker.selectInjectionRecords({
      sessionID: transformInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
    })

    const system = buildSystemMemoryContext({
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
