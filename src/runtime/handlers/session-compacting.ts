import { buildCompactionMemoryContext as defaultBuildCompactionMemoryContext } from "../injection/compaction-context.js"
import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

type BuildCompactionMemoryContext = typeof defaultBuildCompactionMemoryContext

export interface SessionCompactingHandlerDependencies {
  worker: Pick<MemoryWorkerService, "selectInjectionRecords">
  maxSummaries: number
  maxObservations: number
  maxChars: number
  buildCompactionMemoryContext?: BuildCompactionMemoryContext
}

export function createSessionCompactingHandler(input: SessionCompactingHandlerDependencies) {
  const buildCompactionMemoryContext = input.buildCompactionMemoryContext ?? defaultBuildCompactionMemoryContext

  return async (
    compactingInput: { sessionID?: string },
    output: { context: string[] },
  ) => {
    const selected = await input.worker.selectInjectionRecords({
      sessionID: compactingInput.sessionID,
      maxSummaries: input.maxSummaries,
      maxObservations: input.maxObservations,
    })

    const context = buildCompactionMemoryContext({
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
