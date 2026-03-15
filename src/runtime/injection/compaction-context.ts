import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

export function buildCompactionMemoryContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  maxSummaries?: number
  maxObservations?: number
  maxChars?: number
}): string[] {
  const lines: string[] = []
  const maxChars = input.maxChars ?? Number.POSITIVE_INFINITY
  let currentLength = 0

  const coveredObservationIDs = new Set(input.summaries.flatMap((summary) => summary.observationIDs))
  const summaries = input.summaries.slice(0, input.maxSummaries ?? input.summaries.length)
  const unsummarizedObservations =
    summaries.length > 0
      ? input.observations.filter((observation) => !coveredObservationIDs.has(observation.id))
      : input.observations
  const observations = unsummarizedObservations.slice(
    0,
    input.maxObservations ?? unsummarizedObservations.length,
  )

  pushLine(lines, "[CONTINUITY CHECKPOINTS]", maxChars, () => currentLength, (value) => {
    currentLength = value
  })
  pushLine(
    lines,
    "Preserve these memory checkpoints in the compaction summary so the next agent can resume work accurately.",
    maxChars,
    () => currentLength,
    (value) => {
      currentLength = value
    },
  )

  if (summaries.length > 0) {
    pushLine(lines, "Recent memory summaries:", maxChars, () => currentLength, (value) => {
      currentLength = value
    })
    for (const summary of summaries) {
      if (
        !pushLine(lines, `- Outcome: ${summary.outcomeSummary}`, maxChars, () => currentLength, (value) => {
          currentLength = value
        })
      ) {
        break
      }
      if (summary.nextStep) {
        if (
          !pushLine(lines, `  Next: ${summary.nextStep}`, maxChars, () => currentLength, (value) => {
            currentLength = value
          })
        ) {
          break
        }
      }
    }
  }

  if (observations.length > 0) {
    pushLine(lines, "Recent unsummarized observations:", maxChars, () => currentLength, (value) => {
      currentLength = value
    })
    for (const observation of observations) {
      const phasePrefix = observation.phase ? `[${observation.phase}] ` : ""
      if (
        !pushLine(lines, `- ${phasePrefix}${observation.content}`, maxChars, () => currentLength, (value) => {
          currentLength = value
        })
      ) {
        break
      }
    }
  }

  pushLine(
    lines,
    "When compacting, keep the current goal, finished work, pending next step, and unresolved observations aligned with these checkpoints.",
    maxChars,
    () => currentLength,
    (value) => {
      currentLength = value
    },
  )

  return lines
}

function pushLine(
  lines: string[],
  value: string,
  maxChars: number,
  getCurrentLength: () => number,
  setCurrentLength: (value: number) => void,
): boolean {
  const next = nextLength(getCurrentLength(), value)
  if (next > maxChars) return false
  lines.push(value)
  setCurrentLength(next)
  return true
}

function nextLength(currentLength: number, nextLine: string): number {
  return currentLength === 0 ? nextLine.length : currentLength + 1 + nextLine.length
}
