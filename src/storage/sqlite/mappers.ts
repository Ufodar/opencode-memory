import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import { classifyObservationPhase } from "../../memory/observation/phase.js"
import type {
  ContinuityObservationDetailRecord,
  ContinuityTimelineItem,
} from "../../continuity/contracts.js"
import type {
  ObservationRow,
  RequestAnchorRow,
  SummaryRow,
} from "./types.js"

export function mapObservationRow(row: ObservationRow): ObservationRecord {
  return {
    id: row.id,
    content: row.content,
    sessionID: row.session_id,
    projectPath: row.project_path,
    promptId: row.prompt_id ?? undefined,
    createdAt: row.created_at,
    phase: (row.phase as ObservationRecord["phase"]) ?? undefined,
    tool: {
      name: row.tool_name,
      callID: row.call_id,
      title: row.tool_title ?? undefined,
      status: normalizeStatus(row.tool_status),
    },
    input: {
      summary: row.input_summary,
    },
    output: {
      summary: row.output_summary,
    },
    retrieval: {
      importance: row.importance,
      tags: parseStringArray(row.tags_json),
    },
    trace: parseTrace(row.trace_json),
  }
}

export function mapRequestAnchorRow(row: RequestAnchorRow): RequestAnchorRecord {
  return {
    id: row.id,
    sessionID: row.session_id,
    projectPath: row.project_path,
    content: row.content,
    createdAt: row.created_at,
    summarizedAt: row.summarized_at ?? undefined,
    lastCheckpointObservationAt: row.last_checkpoint_observation_at ?? undefined,
  }
}

export function mapSummaryRow(row: SummaryRow): SummaryRecord {
  return {
    id: row.id,
    sessionID: row.session_id,
    projectPath: row.project_path,
    requestAnchorID: row.request_anchor_id,
    requestSummary: row.request_summary,
    outcomeSummary: row.outcome_summary,
    nextStep: row.next_step ?? undefined,
    observationIDs: parseStringArray(row.observation_ids_json),
    createdAt: row.created_at,
  }
}

export function mapObservationDetailRow(row: ObservationRow): ContinuityObservationDetailRecord {
  const observation = mapObservationRow(row)

  return {
    kind: "observation",
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    phase: classifyObservationPhase(observation),
    tool: row.tool_name,
    importance: row.importance,
    tags: parseStringArray(row.tags_json),
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    trace: parseTrace(row.trace_json),
  }
}

export function mapTimelineSummaryRow(
  row: SummaryRow,
  isAnchor: boolean,
): ContinuityTimelineItem {
  return {
    kind: "summary",
    id: row.id,
    content: row.outcome_summary,
    createdAt: row.created_at,
    requestSummary: row.request_summary,
    nextStep: row.next_step ?? undefined,
    isAnchor,
  }
}

export function mapTimelineObservationRow(
  row: ObservationRow,
  isAnchor: boolean,
): ContinuityTimelineItem {
  return {
    kind: "observation",
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    phase: classifyObservationPhase(mapObservationRow(row)),
    tool: row.tool_name,
    importance: row.importance,
    tags: parseStringArray(row.tags_json),
    isAnchor,
  }
}

export function compareTimelineKinds(
  a: "summary" | "observation",
  b: "summary" | "observation",
) {
  if (a === b) return 0
  return a === "observation" ? -1 : 1
}

export function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : []
  } catch {
    return []
  }
}

export function parseTrace(value: string): ObservationRecord["trace"] {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

export function normalizeStatus(value: string): ObservationRecord["tool"]["status"] {
  if (value === "success" || value === "error" || value === "unknown") return value
  return "unknown"
}

export function summarizeLegacyReadRow(
  toolTitle: string | null,
  content: string,
  outputSummary: string,
): string {
  const fromTitle = (toolTitle ?? "").trim()
  if (fromTitle) {
    return `read: ${fromTitle}`
  }

  const path = extractLegacyPath(content) ?? extractLegacyPath(outputSummary)
  if (path) {
    return `read: ${summarizeLegacyPath(path)}`
  }

  return "read: captured file"
}

export function scoreSummaryRow(row: SummaryRow, query: string): number {
  const q = query.toLowerCase()
  let score = 0

  if (row.outcome_summary.toLowerCase().includes(q)) score += 30
  if (row.request_summary.toLowerCase().includes(q)) score += 10
  if ((row.next_step ?? "").toLowerCase().includes(q)) score += 5

  return score
}

export function scoreObservationRow(row: ObservationRow, query: string): number {
  const q = query.toLowerCase()
  let score = 0

  if (row.content.toLowerCase().includes(q)) score += 30
  if (row.output_summary.toLowerCase().includes(q)) score += 10
  if (row.input_summary.toLowerCase().includes(q)) score += 5
  if (row.tags_json.toLowerCase().includes(q)) score += 3

  return score
}

function extractLegacyPath(value: string): string | undefined {
  const match = value.match(/<path>(.*?)<\/path>/u)
  return match?.[1]?.trim() || undefined
}

function summarizeLegacyPath(value: string): string {
  const normalized = value.trim()
  const segments = normalized.split("/").filter(Boolean)
  if (segments.length === 0) return normalized
  if (segments.length === 1) return segments[0]!
  return segments.slice(-2).join("/")
}
