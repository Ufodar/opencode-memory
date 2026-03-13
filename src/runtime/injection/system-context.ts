import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

export function buildSystemContinuityContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
}): string[] {
  const system: string[] = []
  const coveredObservationIDs = new Set(input.summaries.flatMap((summary) => summary.observationIDs))

  if (input.summaries.length > 0) {
    system.push("[CONTINUITY]")
    system.push("Recent summaries:")
    for (const summary of input.summaries) {
      system.push(`- ${summary.outcomeSummary}`)
      if (summary.nextStep) system.push(`  Next: ${summary.nextStep}`)
    }
  }

  const unsummarizedObservations =
    input.summaries.length > 0
      ? input.observations.filter((observation) => !coveredObservationIDs.has(observation.id))
      : input.observations

  if (unsummarizedObservations.length > 0) {
    system.push(input.summaries.length > 0 ? "Recent unsummarized observations:" : "Recent observations:")
    for (const observation of unsummarizedObservations) {
      system.push(`- ${observation.content}`)
    }
  }

  return system
}
