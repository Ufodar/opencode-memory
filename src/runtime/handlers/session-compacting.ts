import type { ContinuityInjectionStore } from "../../continuity/contracts.js"
import { buildCompactionContinuityContext as defaultBuildCompactionContinuityContext } from "../injection/compaction-context.js"
import { selectInjectionRecords as defaultSelectInjectionRecords } from "../injection/select-context.js"

type SelectInjectionRecords = typeof defaultSelectInjectionRecords
type BuildCompactionContinuityContext = typeof defaultBuildCompactionContinuityContext

export interface SessionCompactingHandlerDependencies {
  store: ContinuityInjectionStore
  projectPath: string
  maxSummaries: number
  maxObservations: number
  maxChars: number
  selectInjectionRecords?: SelectInjectionRecords
  buildCompactionContinuityContext?: BuildCompactionContinuityContext
}

export function createSessionCompactingHandler(input: SessionCompactingHandlerDependencies) {
  const selectInjectionRecords = input.selectInjectionRecords ?? defaultSelectInjectionRecords
  const buildCompactionContinuityContext =
    input.buildCompactionContinuityContext ?? defaultBuildCompactionContinuityContext

  return async (
    compactingInput: { sessionID?: string },
    output: { context: string[] },
  ) => {
    const selected = selectInjectionRecords({
      store: input.store,
      projectPath: input.projectPath,
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
