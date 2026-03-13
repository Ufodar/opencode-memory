import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

export function buildSystemContinuityContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  maxSummaries?: number
  maxObservations?: number
  maxChars?: number
}): string[] {
  const system: string[] = []
  const maxChars = input.maxChars ?? Number.POSITIVE_INFINITY
  let currentLength = 0
  const coveredObservationIDs = new Set(input.summaries.flatMap((summary) => summary.observationIDs))
  const summaries = input.summaries.slice(0, input.maxSummaries ?? input.summaries.length)

  if (summaries.length > 0) {
    pushLine(system, "[CONTINUITY]")
    if (!canFit(currentLength, "[CONTINUITY]", maxChars)) return system
    currentLength = nextLength(currentLength, "[CONTINUITY]")

    if (canFit(currentLength, "Recent summaries:", maxChars)) {
      pushLine(system, "Recent summaries:")
      currentLength = nextLength(currentLength, "Recent summaries:")
    }

    for (const summary of summaries) {
      const summaryLine = `- ${summary.outcomeSummary}`
      if (!canFit(currentLength, summaryLine, maxChars)) break
      pushLine(system, summaryLine)
      currentLength = nextLength(currentLength, summaryLine)

      if (summary.nextStep) {
        const nextLine = `  Next: ${summary.nextStep}`
        if (!canFit(currentLength, nextLine, maxChars)) break
        pushLine(system, nextLine)
        currentLength = nextLength(currentLength, nextLine)
      }
    }
  }

  const unsummarizedObservations =
    summaries.length > 0
      ? input.observations.filter((observation) => !coveredObservationIDs.has(observation.id))
      : input.observations
  const observations = unsummarizedObservations.slice(
    0,
    input.maxObservations ?? unsummarizedObservations.length,
  )

  if (observations.length > 0) {
    const header = summaries.length > 0 ? "Recent unsummarized observations:" : "Recent observations:"
    if (canFit(currentLength, header, maxChars)) {
      pushLine(system, header)
      currentLength = nextLength(currentLength, header)
    }
    for (const observation of observations) {
      const line = `- ${observation.content}`
      if (!canFit(currentLength, line, maxChars)) break
      pushLine(system, line)
      currentLength = nextLength(currentLength, line)
    }
  }

  return system
}

function canFit(currentLength: number, nextLine: string, maxChars: number): boolean {
  return nextLength(currentLength, nextLine) <= maxChars
}

function nextLength(currentLength: number, nextLine: string): number {
  return currentLength === 0 ? nextLine.length : currentLength + 1 + nextLine.length
}

function pushLine(lines: string[], value: string) {
  lines.push(value)
}
