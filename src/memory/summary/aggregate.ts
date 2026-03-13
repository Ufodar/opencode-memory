import type { ObservationRecord } from "../observation/types.js"
import type { RequestAnchorRecord } from "../request/types.js"
import type { SummaryRecord } from "./types.js"

export function summarizeRequestWindow(input: {
  request: RequestAnchorRecord
  observations: ObservationRecord[]
}): SummaryRecord {
  const ordered = [...input.observations].sort((a, b) => a.createdAt - b.createdAt)
  const topOutcomeBits = ordered.slice(0, 3).map((item) => item.output.summary || item.content)
  const decisionLike = [...ordered]
    .reverse()
    .find((item) => /(决策|下一步|先|继续|生成|输出)/.test(item.content))

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

export function shouldAggregateRequestWindow(input: {
  observations: ObservationRecord[]
}): boolean {
  if (input.observations.length >= 2) return true

  return input.observations.some((item) => item.retrieval.importance >= 0.9)
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
