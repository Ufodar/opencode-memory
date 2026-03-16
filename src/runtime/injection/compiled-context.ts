import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import {
  buildCuratedSummaryText,
  buildCuratedSummaryCheckpointText,
  buildSessionSnapshotFields,
  buildCuratedTimelineText,
  buildExpandedObservationDetailLines,
  buildContextIndexGuideLines,
  buildTimelineKeyLines,
  buildTokenKeyLines,
  buildContextEconomicsLines,
  buildContextEconomicsEstimate,
  buildContextValueLines,
  buildProjectFreshnessLines,
  buildVisibleSummaryID,
  buildVisibleObservationID,
  buildInlineObservationTypeTag,
  buildInlineObservationTokenHint,
  buildResumeActionText,
  buildPreviouslyHandoffText,
  buildCheckpointTimePrefix,
  buildCheckpointDayLabel,
  shouldRenderLatestSnapshot,
  selectExpandedObservationIDs,
} from "./curated-context-text.js"
import {
  buildExpandedObservationEvidenceText,
  buildInvestigatedObservationHints,
  buildObservationEvidenceHint,
  buildObservationPrimaryFileLabel,
} from "./evidence-hints.js"

export function buildCompiledMemoryContext(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  latestSummaryObservations?: ObservationRecord[]
  priorAssistantMessage?: string
  scope?: "session" | "project"
  maxChars?: number
}): string[] {
  const lines: string[] = []
  const maxChars = input.maxChars ?? Number.POSITIVE_INFINITY
  let currentLength = 0

  const push = (value: string) => pushLine(lines, value, maxChars, () => currentLength, (next) => {
    currentLength = next
  })

  if (!push("[CONTINUITY]")) return lines

  if (input.scope) {
    const scopeLine =
      input.scope === "session" ? "Scope: current session memory" : "Scope: project memory"
    push(scopeLine)
  }

  const hasPotentialBody =
    input.summaries.length > 0 || input.observations.length > 0 || Boolean(input.priorAssistantMessage)
  const headerProjectPath =
    input.summaries[0]?.projectPath ??
    input.observations[0]?.projectPath ??
    input.latestSummaryObservations?.[0]?.projectPath
  const shouldRenderProjectFreshness =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 640

  if (shouldRenderProjectFreshness) {
    for (const line of buildProjectFreshnessLines({ projectPath: headerProjectPath })) {
      if (!push(line)) return lines
    }
  }

  const shouldRenderContextTrustGuidance =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 480
  const shouldRenderDetailedSearchGuidance =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 480

  for (const guideLine of buildContextIndexGuideLines({
    includeTrustGuidance: shouldRenderContextTrustGuidance,
    includeDetailedSearchGuidance: shouldRenderDetailedSearchGuidance,
  })) {
    if (!push(guideLine)) return lines
  }
  const shouldRenderTimelineKey =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 480

  if (shouldRenderTimelineKey) {
    for (const guideLine of buildTimelineKeyLines()) {
      if (!push(guideLine)) return lines
    }
    for (const guideLine of buildTokenKeyLines()) {
      if (!push(guideLine)) return lines
    }
  }

  const coveredObservationCount = new Set(
    input.summaries.flatMap((summary) => summary.observationIDs),
  ).size
  const contextEconomics = buildContextEconomicsEstimate({
    summaries: input.summaries,
    observations: input.observations,
    coveredObservationCount,
  })
  const shouldRenderContextEconomics =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 560

  if (shouldRenderContextEconomics) {
    for (const economicsLine of buildContextEconomicsLines(contextEconomics)) {
      if (!push(economicsLine)) return lines
    }
  }

  const latestSummary = input.summaries[0]
  let summarySectionSummaries = input.summaries
  if (latestSummary && shouldRenderLatestSnapshot(latestSummary.createdAt, input.observations)) {
    const investigatedSummary = buildLatestSummaryInvestigatedSummary({
      summary: latestSummary,
      latestSummaryObservations: input.latestSummaryObservations,
      observations: input.observations,
    })
    const learnedSummary = buildLatestSummaryLearnedSummary({
      summary: latestSummary,
      latestSummaryObservations: input.latestSummaryObservations,
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
      summarySectionSummaries = input.summaries.slice(1)
      if (!push("[LATEST SESSION SNAPSHOT]")) return lines
      if (!push(`- Summary ID: ${buildVisibleSummaryID(latestSummary.id)}`)) return lines
      for (const field of snapshotFields) {
        if (!push(`- ${field.label}: ${field.value}`)) return lines
      }
    }
  }

  if (summarySectionSummaries.length > 0 || input.observations.length > 0) {
    if (!push("[MEMORY TIMELINE]")) return lines
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
      })} (${buildVisibleSummaryID(summary.id)})`
      const nextLine = summary.nextStep ? `  Next: ${buildResumeActionText(summary.nextStep)}` : undefined
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

    const expandedObservationIDs = selectExpandedObservationIDs(input.observations)
    for (const observation of input.observations) {
      const timePrefix = buildCheckpointTimePrefix(observation.createdAt)
      const phasePrefix = observation.phase ? `[${observation.phase}] ` : ""
      const toolTag = buildInlineObservationTypeTag(observation.tool.name)
      const tokenHint = buildInlineObservationTokenHint(observation)
      const fileLabel = buildObservationPrimaryFileLabel(observation.trace)
      const evidenceHint = fileLabel ? undefined : buildObservationEvidenceHint(observation.trace)
      const curatedObservation = buildCuratedTimelineText(observation.content)
      const hintParts = [evidenceHint, tokenHint, `[${buildVisibleObservationID(observation.id)}]`].filter(
        (value): value is string => Boolean(value),
      )
      const line = `- ${timePrefix}${phasePrefix}${toolTag}${curatedObservation} (${hintParts.join("; ")})`
      const detailLines = expandedObservationIDs.has(observation.id)
        ? buildExpandedObservationDetailLines({
            observation,
            evidenceText: buildExpandedObservationEvidenceText(observation.trace, fileLabel),
            includeTokenHint: true,
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
        if (!push(dayLabel)) return lines
        currentDayLabel = dayLabel
        currentFileLabel = undefined
      }

      if (entry.kind === "summary") {
        currentFileLabel = undefined
      } else if (entry.fileLabel && entry.fileLabel !== currentFileLabel) {
        if (!push(`[file] ${entry.fileLabel}`)) return lines
        currentFileLabel = entry.fileLabel
      }

      let exhausted = false
      for (const line of entry.lines) {
        if (!push(line)) {
          exhausted = true
          break
        }
      }
      if (exhausted) {
        return lines
      }
    }
  }

  const guide = buildResumeGuide(input.summaries, input.observations)
  if (guide) {
    if (!push("[RESUME GUIDE]")) return lines
    push(`- ${guide}`)
  }

  const previousHandoff = buildPreviouslyHandoffText(input.priorAssistantMessage)
  if (previousHandoff) {
    if (!push("[PREVIOUSLY]")) return lines
    push(`- ${previousHandoff}`)
  }

  const shouldRenderContextValue =
    !hasPotentialBody || maxChars === Number.POSITIVE_INFINITY || maxChars > 640

  if (shouldRenderContextValue) {
    for (const line of buildContextValueLines({
      summaryCount: input.summaries.length,
      directObservationCount: input.observations.length,
      coveredObservationCount,
      loadingTokens: contextEconomics.loadingTokens,
      workTokens: contextEconomics.workTokens,
    })) {
      if (!push(line)) return lines
    }
  }

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

function buildResumeGuide(
  summaries: SummaryRecord[],
  observations: ObservationRecord[],
): string | undefined {
  const latestSummary = summaries[0]
  if (latestSummary?.nextStep) {
    return `Next action: ${buildResumeActionText(latestSummary.nextStep)}`
  }

  if (latestSummary?.outcomeSummary) {
    return `Pick up from: ${buildResumeActionText(latestSummary.outcomeSummary)}`
  }

  const latestObservation = observations[0]
  if (latestObservation) {
    return `Review: ${buildResumeActionText(latestObservation.content)}`
  }

  return undefined
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
