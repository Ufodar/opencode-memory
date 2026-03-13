import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

export function buildSystemContinuityContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
}): string[] {
  const system: string[] = []

  if (input.summaries.length > 0) {
    system.push("[CONTINUITY]")
    system.push("Recent summaries:")
    for (const summary of input.summaries) {
      system.push(`- ${summary.outcomeSummary}`)
      if (summary.nextStep) system.push(`  Next: ${summary.nextStep}`)
    }
  }

  if (input.observations.length > 0) {
    system.push("Recent observations:")
    for (const observation of input.observations) {
      system.push(`- ${observation.content}`)
    }
  }

  return system
}
