import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import type { ContinuityInjectionStore } from "../../continuity/contracts.js"

export function selectInjectionRecords(input: {
  store: ContinuityInjectionStore
  projectPath: string
  sessionID?: string
  maxSummaries: number
  maxObservations: number
}): {
  scope: "session" | "project"
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
} {
  const sessionID = input.sessionID

  if (sessionID) {
    const sessionSummaries = input.store.listRecentSummaries({
      projectPath: input.projectPath,
      sessionID,
      limit: input.maxSummaries,
    })
    const sessionObservations = input.store.listRecentObservations({
      projectPath: input.projectPath,
      sessionID,
      limit: input.maxObservations,
    })

    if (sessionSummaries.length > 0 || sessionObservations.length > 0) {
      return {
        scope: "session",
        summaries: sessionSummaries,
        observations: sessionObservations,
      }
    }
  }

  return {
    scope: "project",
    summaries: input.store.listRecentSummaries({
      projectPath: input.projectPath,
      limit: input.maxSummaries,
    }),
    observations: input.store.listRecentObservations({
      projectPath: input.projectPath,
      limit: input.maxObservations,
    }),
  }
}
