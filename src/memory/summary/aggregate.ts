import type { ObservationRecord } from "../observation/types.js"
import type { RequestAnchorRecord } from "../request/types.js"
import type { SummaryRecord } from "./types.js"
import type { ModelSummaryResult } from "../../services/ai/model-summary.js"
import { classifyObservationPhase, looksLikeDecisionSignal } from "../observation/phase.js"

export function summarizeRequestWindow(input: {
  request: RequestAnchorRecord
  observations: ObservationRecord[]
}): SummaryRecord {
  const ordered = [...input.observations].sort((a, b) => a.createdAt - b.createdAt)
  const topOutcomeBits = ordered.slice(0, 3).map((item) => item.output.summary || item.content)
  const decisionLike = [...ordered]
    .reverse()
    .find((item) => looksLikeDecisionSignal(item.content))

  return {
    id: `sum_${Date.now()}_${input.request.id}`,
    sessionID: input.request.sessionID,
    projectPath: input.request.projectPath,
    requestAnchorID: input.request.id,
    requestSummary: truncate(input.request.content, 120),
    outcomeSummary: topOutcomeBits.join("；"),
    nextStep: decisionLike ? extractNextStep(decisionLike.content) : undefined,
    observationIDs: ordered.map((item) => item.id),
    createdAt: Date.now(),
  }
}

export async function buildSummaryRecord(input: {
  request: RequestAnchorRecord
  observations: ObservationRecord[]
  generateModelSummary?: (input: {
    request: RequestAnchorRecord
    observations: ObservationRecord[]
  }) => Promise<ModelSummaryResult | null>
}): Promise<SummaryRecord> {
  const deterministic = summarizeRequestWindow(input)
  const assisted = await input.generateModelSummary?.({
    request: input.request,
    observations: input.observations,
  })

  if (!assisted) return deterministic

  return {
    ...deterministic,
    outcomeSummary: assisted.outcomeSummary,
    nextStep: assisted.nextStep ?? deterministic.nextStep,
  }
}

export function shouldAggregateRequestWindow(input: {
  observations: ObservationRecord[]
}): boolean {
  if (input.observations.length >= 2) return true

  if (input.observations.some((item) => item.retrieval.importance >= 0.9)) return true

  if (input.observations.length === 1) {
    const phase = classifyObservationPhase(input.observations[0]!)
    return phase === "execution" || phase === "verification" || phase === "decision"
  }

  return false
}

export function selectCheckpointObservations(input: {
  observations: ObservationRecord[]
}): ObservationRecord[] {
  const ordered = [...input.observations].sort((a, b) => a.createdAt - b.createdAt)
  if (ordered.length === 0) return []

  const decisionIndex = findLastIndex(ordered, (item) => classifyObservationPhase(item) === "decision")
  if (decisionIndex >= 0) {
    const selected = ordered.slice(0, decisionIndex + 1)
    return shouldAggregateRequestWindow({ observations: selected }) ? selected : []
  }

  const phases = ordered.map((item) => classifyObservationPhase(item))
  const lastPhase = phases[phases.length - 1]

  let boundaryStart = 0
  for (let index = phases.length - 1; index >= 0; index -= 1) {
    if (phases[index] !== lastPhase) {
      boundaryStart = index + 1
      break
    }
  }

  if (boundaryStart > 0) {
    const selected = ordered.slice(0, boundaryStart)
    return shouldAggregateRequestWindow({ observations: selected }) ? selected : []
  }

  return shouldAggregateRequestWindow({ observations: ordered }) ? ordered : []
}

function extractNextStep(content: string): string {
  const parts = content.split(/[：:]/)
  if (parts.length > 1) {
    return truncate(parts.slice(1).join(":").trim(), 100)
  }
  return truncate(content.trim(), 100)
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}...`
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index]!)) return index
  }
  return -1
}
