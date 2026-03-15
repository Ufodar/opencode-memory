import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

export interface SystemTransformHandlerDependencies {
  worker: Pick<MemoryWorkerService, "buildSystemContext">
  maxSummaries: number
  maxObservations: number
  maxChars: number
}

export function createSystemTransformHandler(input: SystemTransformHandlerDependencies) {
  return async (
    transformInput: { sessionID?: string },
    output: { system: string[] },
  ) => {
    const system = await input.worker.buildSystemContext({
      sessionID: transformInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
      maxChars: input.maxChars,
    })

    if (system.length > 0) {
      output.system.unshift(...system)
    }
  }
}
