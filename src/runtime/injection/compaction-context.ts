import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import {
  buildCuratedSummaryText,
  buildCuratedSummaryCheckpointText,
  buildSessionSnapshotFields,
  buildCuratedTimelineText,
  buildExpandedObservationDetailLines,
  buildResumeActionText,
  buildCheckpointTimePrefix,
  buildCheckpointDayLabel,
  selectExpandedObservationIDs,
} from "./curated-context-text.js"
import {
  buildExpandedObservationEvidenceText,
  buildInvestigatedObservationHints,
  buildObservationEvidenceHint,
  buildObservationPrimaryFileLabel,
} from "./evidence-hints.js"

export function buildCompactionMemoryContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  latestSummaryObservations?: ObservationRecord[]
  maxSummaries?: number
  maxObservations?: number
  maxChars?: number
}): string[] {
  const lines: string[] = []
  const maxChars = input.maxChars ?? Number.POSITIVE_INFINITY
  let currentLength = 0

  const coveredObservationIDs = new Set(input.summaries.flatMap((summary) => summary.observationIDs))
  const summaries = input.summaries.slice(0, input.maxSummaries ?? input.summaries.length)
  const latestSummaryForSnapshot = summaries[0]
  const latestSummaryObservations =
    input.latestSummaryObservations ??
    (latestSummaryForSnapshot
      ? latestSummaryForSnapshot.observationIDs
          .map((id) => input.observations.find((observation) => observation.id === id))
          .filter((observation): observation is ObservationRecord => Boolean(observation))
      : [])
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

  const latestSummary = summaries[0]
  let summarySectionSummaries = summaries
  if (latestSummary) {
    const investigatedSummary = buildLatestSummaryInvestigatedSummary({
      summary: latestSummary,
      latestSummaryObservations,
      observations: input.observations,
    })
    const learnedSummary = buildLatestSummaryLearnedSummary({
      summary: latestSummary,
      latestSummaryObservations,
      observations: input.observations,
    })
    const snapshotFields = buildSessionSnapshotFields({
      requestSummary: latestSummary.requestSummary,
      investigatedSummary,
      learnedSummary,
      outcomeSummary: latestSummary.outcomeSummary,
      nextStep: latestSummary.nextStep,
    })

    if (snapshotFields.length > 0) {
      summarySectionSummaries = summaries.slice(1)
      pushLine(lines, "Latest session snapshot:", maxChars, () => currentLength, (value) => {
        currentLength = value
      })

      for (const field of snapshotFields) {
        if (
          !pushLine(lines, `- ${field.label}: ${field.value}`, maxChars, () => currentLength, (value) => {
            currentLength = value
          })
        ) {
          break
        }
      }
    }
  }

  if (summarySectionSummaries.length > 0 || observations.length > 0) {
    pushLine(lines, "Recent timeline checkpoints:", maxChars, () => currentLength, (value) => {
      currentLength = value
    })
    const timelineEntries: Array<{
      kind: "summary" | "observation"
      createdAt: number
      order: number
      lines: string[]
      fileLabel?: string
    }> = []
    let order = 0
    const seenSummaryEntries = new Set<string>()
    for (const summary of summarySectionSummaries) {
      const timePrefix = buildCheckpointTimePrefix(summary.createdAt)
      const summaryLine = `- ${timePrefix}[summary] ${buildCuratedSummaryCheckpointText({
        requestSummary: summary.requestSummary,
        outcomeSummary: summary.outcomeSummary,
      })}`
      const nextLine = summary.nextStep
        ? `  Next: ${buildResumeActionText(summary.nextStep)}`
        : undefined
      const dedupeKey = nextLine ? `${summaryLine}\n${nextLine}` : summaryLine

      if (seenSummaryEntries.has(dedupeKey)) continue
      seenSummaryEntries.add(dedupeKey)
      timelineEntries.push({
        kind: "summary",
        createdAt: summary.createdAt,
        order: order++,
        lines: nextLine ? [summaryLine, nextLine] : [summaryLine],
      })
    }

    const expandedObservationIDs = selectExpandedObservationIDs(observations)
    for (const observation of observations) {
      const timePrefix = buildCheckpointTimePrefix(observation.createdAt)
      const phasePrefix = observation.phase ? `[${observation.phase}] ` : ""
      const fileLabel = buildObservationPrimaryFileLabel(observation.trace)
      const evidenceHint = fileLabel ? undefined : buildObservationEvidenceHint(observation.trace)
      const curatedObservation = buildCuratedTimelineText(observation.content)
      const line = evidenceHint
        ? `- ${timePrefix}${phasePrefix}${curatedObservation} (${evidenceHint})`
        : `- ${timePrefix}${phasePrefix}${curatedObservation}`
      const detailLines = expandedObservationIDs.has(observation.id)
        ? buildExpandedObservationDetailLines({
            observation,
            evidenceText: buildExpandedObservationEvidenceText(observation.trace, fileLabel),
          })
        : []
      timelineEntries.push({
        kind: "observation",
        createdAt: observation.createdAt,
        order: order++,
        lines: [line, ...detailLines],
        fileLabel,
      })
    }

    const sortedEntries = timelineEntries.sort(
      (left, right) => left.createdAt - right.createdAt || left.order - right.order,
    )
    const distinctDayLabels = new Set(
      sortedEntries
        .map((entry) => buildCheckpointDayLabel(entry.createdAt))
        .filter((label): label is string => Boolean(label)),
    )
    let currentDayLabel: string | undefined
    let currentFileLabel: string | undefined

    for (const entry of sortedEntries) {
      const dayLabel =
        distinctDayLabels.size > 1 ? buildCheckpointDayLabel(entry.createdAt) : undefined
      if (dayLabel && dayLabel !== currentDayLabel) {
        if (
          !pushLine(lines, dayLabel, maxChars, () => currentLength, (value) => {
            currentLength = value
          })
        ) {
          break
        }
        currentDayLabel = dayLabel
        currentFileLabel = undefined
      }

      if (entry.kind === "summary") {
        currentFileLabel = undefined
      } else if (entry.fileLabel && entry.fileLabel !== currentFileLabel) {
        if (
          !pushLine(lines, `[file] ${entry.fileLabel}`, maxChars, () => currentLength, (value) => {
            currentLength = value
          })
        ) {
          break
        }
        currentFileLabel = entry.fileLabel
      }

      let exhausted = false
      for (const line of entry.lines) {
        if (
          !pushLine(lines, line, maxChars, () => currentLength, (value) => {
            currentLength = value
          })
        ) {
          exhausted = true
          break
        }
      }
      if (exhausted) {
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

function buildLatestSummaryLearnedSummary(input: {
  summary: SummaryRecord
  latestSummaryObservations?: ObservationRecord[]
  observations: ObservationRecord[]
}): string | undefined {
  const coveredObservations =
    input.latestSummaryObservations?.length
      ? input.latestSummaryObservations
      : input.summary.observationIDs
          .map((id) => input.observations.find((observation) => observation.id === id))
          .filter((observation): observation is ObservationRecord => Boolean(observation))

  const learnedObservation = coveredObservations.find((observation) => observation.content.trim().length > 0)
  if (!learnedObservation) return undefined

  return buildCuratedTimelineText(learnedObservation.content)
}

function buildLatestSummaryInvestigatedSummary(input: {
  summary: SummaryRecord
  latestSummaryObservations?: ObservationRecord[]
  observations: ObservationRecord[]
}): string | undefined {
  const coveredObservations =
    input.latestSummaryObservations?.length
      ? input.latestSummaryObservations
      : input.summary.observationIDs
          .map((id) => input.observations.find((observation) => observation.id === id))
          .filter((observation): observation is ObservationRecord => Boolean(observation))

  return buildInvestigatedObservationHints(coveredObservations)
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
