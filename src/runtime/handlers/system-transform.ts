import type { ContinuityInjectionStore } from "../../continuity/contracts.js"
import { buildSystemContinuityContext as defaultBuildSystemContinuityContext } from "../injection/system-context.js"
import { selectInjectionRecords as defaultSelectInjectionRecords } from "../injection/select-context.js"

type SelectInjectionRecords = typeof defaultSelectInjectionRecords
type BuildSystemContinuityContext = typeof defaultBuildSystemContinuityContext

export interface SystemTransformHandlerDependencies {
  store: ContinuityInjectionStore
  projectPath: string
  maxSummaries: number
  maxObservations: number
  maxChars: number
  selectInjectionRecords?: SelectInjectionRecords
  buildSystemContinuityContext?: BuildSystemContinuityContext
}

export function createSystemTransformHandler(input: SystemTransformHandlerDependencies) {
  const selectInjectionRecords = input.selectInjectionRecords ?? defaultSelectInjectionRecords
  const buildSystemContinuityContext =
    input.buildSystemContinuityContext ?? defaultBuildSystemContinuityContext

  return async (
    transformInput: { sessionID?: string },
    output: { system: string[] },
  ) => {
    const selected = selectInjectionRecords({
      store: input.store,
      projectPath: input.projectPath,
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
