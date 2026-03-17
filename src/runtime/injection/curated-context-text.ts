import { basename } from "node:path"

import type { ObservationRecord } from "../../memory/observation/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

const ELLIPSIS = "…"
const CHARS_PER_TOKEN_ESTIMATE = 4

export interface SessionSnapshotField {
  label: "Current Focus" | "Investigated" | "Learned" | "Completed" | "Next"
  value: string
}

export function buildContextIndexGuideLines(input?: {
  includeTrustGuidance?: boolean
  includeDetailedSearchGuidance?: boolean
}): string[] {
  const lines = [
    "[CONTEXT INDEX] This semantic index (summaries, phases, tools, files, and tokens) is usually sufficient to understand past work.",
  ]

  if (input?.includeDetailedSearchGuidance) {
    lines.push("- When you need implementation details, rationale, or debugging context:")
    lines.push("- Fetch by ID: memory_details(visible IDs) for record detail")
    lines.push("- Expand a checkpoint window: memory_timeline(checkpoint)")
    lines.push("- Search history: memory_search(decisions, bugs, deeper research)")
  } else {
    lines.push(
      "- memory_details=visible ID -> record detail | memory_timeline=checkpoint window | memory_search=broader lookup",
    )
  }

  if (input?.includeTrustGuidance) {
    lines.push("- Trust this index over re-reading code for past decisions and learnings.")
  }

  return lines
}

export function buildTimelineKeyLines(): string[] {
  return [
    "[TIMELINE KEY]",
    "- [summary]: summary checkpoint marker",
    "- [research/planning/execution/verification/decision]: phase label",
    "- {tool}: source tool tag",
    "- [day]: day grouping line",
    "- [file]: file grouping line",
  ]
}

export function buildTokenKeyLines(): string[] {
  return [
    "[TOKEN KEY]",
    "- Read: cost to read this memory now (cost to learn it now)",
    "- Work: past work tokens already spent to produce it (research, building, deciding)",
  ]
}

export function buildInlineObservationTypeTag(toolName?: string): string {
  const normalized = normalizeText(toolName ?? "")
  if (!normalized) return ""
  return `{${normalized.toLowerCase()}} `
}

export function buildInlineObservationTokenHint(
  observation: ObservationRecord,
): string | undefined {
  return buildObservationTokenHint(observation)
}

export function buildContextEconomicsLines(input: {
  summaryCount: number
  directObservationCount: number
  coveredObservationCount: number
  loadingTokens: number
  workTokens: number
  savingsTokens: number
  savingsPercent: number
}): string[] {
  return [
    "[CONTEXT ECONOMICS]",
    `- summaries: ${input.summaryCount} | direct observations: ${input.directObservationCount} | covered observations: ${input.coveredObservationCount}`,
    `- Loading: ~${input.loadingTokens.toLocaleString()} tokens to read this index`,
    `- Work investment: ~${input.workTokens.toLocaleString()} tokens captured from prior work`,
    `- Your savings: ~${input.savingsTokens.toLocaleString()} tokens (${input.savingsPercent}% reuse reduction)`,
  ]
}

export function buildContextEconomicsEstimate(input: {
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  coveredObservationCount: number
}): {
  summaryCount: number
  directObservationCount: number
  coveredObservationCount: number
  loadingTokens: number
  workTokens: number
  savingsTokens: number
  savingsPercent: number
} {
  const loadingTokens =
    input.summaries.reduce((sum, summary) => {
      return (
        sum +
        estimateTokens(summary.requestSummary) +
        estimateTokens(summary.outcomeSummary) +
        estimateTokens(summary.nextStep)
      )
    }, 0) +
    input.observations.reduce((sum, observation) => sum + estimateTokens(observation.content), 0)

  const workTokens =
    input.summaries.reduce((sum, summary) => {
      return (
        sum +
        estimateTokens(summary.requestSummary) +
        estimateTokens(summary.outcomeSummary) +
        estimateTokens(summary.nextStep)
      )
    }, 0) +
    input.observations.reduce((sum, observation) => {
      return (
        sum +
        estimateTokens(observation.input.summary) +
        estimateTokens(observation.output.summary) +
        estimateTokens(observation.content)
      )
    }, 0)

  const savingsTokens = Math.max(workTokens - loadingTokens, 0)
  const savingsPercent = workTokens > 0 ? Math.round((savingsTokens / workTokens) * 100) : 0

  return {
    summaryCount: input.summaries.length,
    directObservationCount: input.observations.length,
    coveredObservationCount: input.coveredObservationCount,
    loadingTokens,
    workTokens,
    savingsTokens,
    savingsPercent,
  }
}

export function buildContextValueLines(input: {
  summaryCount: number
  directObservationCount: number
  coveredObservationCount: number
  loadingTokens?: number
  workTokens?: number
}): string[] {
  const lines = [
    "[CONTEXT VALUE]",
    `- This index condenses ${input.coveredObservationCount} covered observations into ${input.summaryCount} checkpoints and ${input.directObservationCount} direct observations; trust it before re-reading past work.`,
  ]

  if ((input.workTokens ?? 0) > 0 && (input.loadingTokens ?? 0) > 0) {
    lines.push(
      `- Access ~${input.workTokens!.toLocaleString()} tokens of past research, building, and decisions for just ~${input.loadingTokens!.toLocaleString()} tokens of reading.`,
    )
  }

  lines.push(
    "- If this index is still not enough, use memory_details with visible IDs to access deeper memory before re-reading history.",
  )

  return lines
}

export function buildProjectFreshnessLines(input: {
  projectPath?: string
  generatedAt?: Date
}): string[] {
  const generatedAt = input.generatedAt ?? new Date()
  const generatedAtLabel = formatGeneratedAt(generatedAt)
  const projectLabel = input.projectPath ? basename(input.projectPath) : undefined

  if (projectLabel) {
    return [`# [${projectLabel}] recent context, ${generatedAtLabel}`]
  }

  return [`# recent context, ${generatedAtLabel}`]
}

export function buildVisibleSummaryID(value: string): string {
  return `#${value}`
}

export function buildVisibleObservationID(value: string): string {
  return `#${value}`
}

export function buildCuratedSummaryText(value: string): string {
  return buildCuratedMultiSegmentText(value, {
    maxSegments: 2,
    maxChars: 140,
    maxSegmentChars: 72,
  })
}

export function buildCuratedSummaryCheckpointText(input: {
  requestSummary?: string
  outcomeSummary: string
}): string {
  const outcome = buildCuratedMultiSegmentText(input.outcomeSummary, {
    maxSegments: 1,
    maxChars: 72,
    maxSegmentChars: 72,
  })

  if (!input.requestSummary) {
    return outcome
  }

  const request = extractLeadClause(input.requestSummary, 28)
  return clamp(`${request}：${outcome}`, 104)
}

export function buildCheckpointTimePrefix(createdAt?: number): string {
  const formatted = formatCheckpointTime(createdAt)
  return formatted ? `[${formatted}] ` : ""
}

export function buildCheckpointDayLabel(createdAt?: number): string | undefined {
  const formatted = formatCheckpointDay(createdAt)
  return formatted ? `[day] ${formatted}` : undefined
}

export function buildCuratedTimelineText(value: string): string {
  return buildCuratedMultiSegmentText(value, {
    maxSegments: 2,
    maxChars: 120,
    maxSegmentChars: 60,
  })
}

export function buildResumeActionText(value: string): string {
  return extractLeadClause(value, 96)
}

export function buildPreviouslyHandoffText(value?: string): string | undefined {
  if (!value) return undefined
  const normalized = normalizeText(value)
  if (!normalized) return normalized
  return clamp(normalized, 180)
}

export function selectExpandedObservationIDs(
  observations: ObservationRecord[],
  maxExpanded = 2,
): Set<string> {
  return new Set(
    observations
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, maxExpanded)
      .map((observation) => observation.id),
  )
}

export function shouldRenderLatestSnapshot(
  latestSummaryCreatedAt: number | undefined,
  observations: ObservationRecord[],
): boolean {
  if (latestSummaryCreatedAt === undefined) return false
  if (observations.length === 0) return true

  const latestObservationCreatedAt = observations.reduce(
    (currentMax, observation) => Math.max(currentMax, observation.createdAt),
    Number.NEGATIVE_INFINITY,
  )

  return latestSummaryCreatedAt > latestObservationCreatedAt
}

export function buildExpandedObservationDetailLines(input: {
  observation: ObservationRecord
  evidenceText?: string
  includeTokenHint?: boolean
}): string[] {
  const lines: string[] = []
  const result = buildExpandedObservationResultText(
    input.observation.output.summary,
    input.observation.content,
  )
  if (result) {
    lines.push(`  Result: ${result}`)
  }

  const tool = buildExpandedObservationToolText(input.observation)
  if (tool) {
    lines.push(`  Tool: ${tool}`)
  }

  if (input.includeTokenHint) {
    const tokenHint = buildObservationTokenHint(input.observation)
    if (tokenHint) {
      lines.push(`  Tokens: ${tokenHint}`)
    }
  }

  if (input.evidenceText) {
    lines.push(`  Evidence: ${input.evidenceText}`)
  }

  return dedupe(lines)
}

function buildObservationTokenHint(
  observation: ObservationRecord,
): string | undefined {
  const readTokens = estimateTokens(observation.content)
  const workTokens =
    estimateTokens(observation.input.summary) +
    estimateTokens(observation.output.summary) +
    estimateTokens(observation.content)

  if (readTokens <= 0 && workTokens <= 0) return undefined

  return `Read ~${readTokens} | Work ~${workTokens}`
}

export function buildSessionSnapshotFields(input: {
  requestSummary?: string
  investigatedSummary?: string
  learnedSummary?: string
  outcomeSummary?: string
  nextStep?: string
}): SessionSnapshotField[] {
  const fields: SessionSnapshotField[] = []
  const currentFocus = buildSnapshotFocusText(input.requestSummary)
  if (currentFocus) {
    fields.push({
      label: "Current Focus",
      value: currentFocus,
    })
  }

  const investigated = buildSnapshotInvestigatedText(input.investigatedSummary)
  if (investigated) {
    fields.push({
      label: "Investigated",
      value: investigated,
    })
  }

  const learned = buildSnapshotLearnedText(input.learnedSummary)
  if (learned) {
    fields.push({
      label: "Learned",
      value: learned,
    })
  }

  const completed = buildSnapshotCompletedText(input.outcomeSummary)
  if (completed) {
    fields.push({
      label: "Completed",
      value: completed,
    })
  }

  const next = buildSnapshotNextText(input)
  if (next) {
    fields.push({
      label: "Next",
      value: next,
    })
  }

  return fields
}

function buildCuratedMultiSegmentText(
  value: string,
  options: { maxSegments: number; maxChars: number; maxSegmentChars: number },
): string {
  const normalized = normalizeText(value)
  if (!normalized) return normalized

  const segments = collectSegments(normalized)
    .slice(0, options.maxSegments)
    .map((segment) => clamp(segment, options.maxSegmentChars))

  return clamp(segments.join("；"), options.maxChars)
}

function estimateTokens(value?: string): number {
  const normalized = normalizeText(value ?? "")
  if (!normalized) return 0
  return Math.max(1, Math.ceil(normalized.length / CHARS_PER_TOKEN_ESTIMATE))
}

function formatGeneratedAt(value: Date): string {
  const formatted = value
    .toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    })
    .replace(",", "")

  return formatted
}

function buildExpandedObservationResultText(
  value: string,
  headline: string,
): string | undefined {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) return undefined

  const normalizedHeadline = normalizeText(headline)
  if (normalizedValue === normalizedHeadline) return undefined

  return buildCuratedMultiSegmentText(normalizedValue, {
    maxSegments: 2,
    maxChars: 120,
    maxSegmentChars: 64,
  })
}

function buildExpandedObservationToolText(observation: ObservationRecord): string | undefined {
  const name = normalizeText(observation.tool.name)
  if (!name) return undefined

  const title = normalizeText(observation.tool.title ?? "")
  if (title && title.toLowerCase() !== name.toLowerCase()) {
    return clamp(`${name}: ${title}`, 96)
  }

  return name
}

function buildSnapshotFocusText(value?: string): string | undefined {
  if (!value) return undefined
  return extractLeadClause(value, 88)
}

function buildSnapshotInvestigatedText(value?: string): string | undefined {
  if (!value) return undefined
  return buildCuratedMultiSegmentText(value, {
    maxSegments: 2,
    maxChars: 96,
    maxSegmentChars: 48,
  })
}

function buildSnapshotCompletedText(value?: string): string | undefined {
  if (!value) return undefined
  const normalized = normalizeText(value)
  if (!normalized) return normalized

  const segments = splitAndNormalize(normalized, /[；;\n]+/)
  if (segments.length > 1) {
    return clamp(
      dedupe(segments)
        .slice(0, 2)
        .map((segment) => clamp(segment, 64))
        .join("；"),
      120,
    )
  }

  return clamp(normalized, 120)
}

function buildSnapshotLearnedText(value?: string): string | undefined {
  if (!value) return undefined
  return buildCuratedMultiSegmentText(value, {
    maxSegments: 1,
    maxChars: 96,
    maxSegmentChars: 96,
  })
}

function buildSnapshotNextText(input: {
  requestSummary?: string
  outcomeSummary?: string
  nextStep?: string
}): string | undefined {
  if (input.nextStep) {
    return buildResumeActionText(input.nextStep)
  }

  if (input.outcomeSummary) {
    return `继续从${extractLeadClause(input.outcomeSummary, 72)}开始`
  }

  if (input.requestSummary) {
    return `继续处理${extractLeadClause(input.requestSummary, 72)}`
  }

  return undefined
}

function collectSegments(value: string): string[] {
  const primarySegments = splitAndNormalize(value, /[；;\n]+/)
  if (primarySegments.length > 1) return dedupe(primarySegments)

  const secondarySegments = splitAndNormalize(value, /(?<=[。！？!?])\s*|[，,]+/)
  if (secondarySegments.length > 1) return dedupe(secondarySegments)

  return [value]
}

function extractLeadClause(value: string, maxChars: number): string {
  const normalized = normalizeText(value)
  if (!normalized) return normalized

  const clause = splitAndNormalize(normalized, /[；;，,。！？!?]+/)[0] ?? normalized
  return clamp(clause, maxChars)
}

function splitAndNormalize(value: string, separator: RegExp): string[] {
  return value
    .split(separator)
    .map(normalizeText)
    .filter((segment) => segment.length > 0)
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function clamp(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars - 1).trimEnd()}${ELLIPSIS}`
}

function formatCheckpointTime(createdAt?: number): string | undefined {
  if (!isLikelyEpochMilliseconds(createdAt)) return undefined

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toISOString().slice(11, 16)
}

function formatCheckpointDay(createdAt?: number): string | undefined {
  if (!isLikelyEpochMilliseconds(createdAt)) return undefined

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toISOString().slice(0, 10)
}

function isLikelyEpochMilliseconds(value?: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= Date.UTC(2000, 0, 1)
}
