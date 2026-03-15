import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

export interface SessionCompactingHandlerDependencies {
  worker: Pick<MemoryWorkerService, "buildCompactionContext">
  maxSummaries: number
  maxObservations: number
  maxChars: number
}

export function createSessionCompactingHandler(input: SessionCompactingHandlerDependencies) {
  return async (
    compactingInput: { sessionID?: string },
    output: { context: string[] },
  ) => {
    const context = await input.worker.buildCompactionContext({
      sessionID: compactingInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
      maxChars: input.maxChars,
    })

    if (context.length > 0) {
      output.context.push(context.join("\n"))
    }
  }
}
