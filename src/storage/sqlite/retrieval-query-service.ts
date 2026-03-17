import type { Database } from "bun:sqlite"
import type {
  MemoryDetailRecord,
  MemoryObservationDetailRecord,
  MemorySearchRecord,
  MemoryTimelineItem,
  MemoryTimelineResult,
} from "../../memory/contracts.js"
import { classifyObservationPhase } from "../../memory/observation/phase.js"
import {
  compareTimelineKinds,
  mapObservationDetailRow,
  mapObservationEvidence,
  mapObservationRow,
  mapTimelineObservationRow,
  mapTimelineSummaryRow,
  parseStringArray,
  scoreObservationRow,
  scoreSummaryRow,
} from "./mappers.js"
import type {
  ObservationRow,
  SummaryRow,
} from "./types.js"
import { INTERNAL_TOOL_SQL_LIST } from "./types.js"

export class MemoryRetrievalService {
  constructor(private readonly db: Database) {}

  searchRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
    kinds?: Array<MemorySearchRecord["kind"]>
  }): MemorySearchRecord[] {
    const pattern = `%${input.query.toLowerCase()}%`
    const includeSummaries = !input.kinds || input.kinds.includes("summary")
    const includeObservations = !input.kinds || input.kinds.includes("observation")

    const summaries = !includeSummaries
      ? []
      : input.sessionID
      ? (this.db
          .prepare(`
            SELECT * FROM summaries
            WHERE project_path = ? AND session_id = ?
              AND (
                lower(request_summary) LIKE ?
                OR lower(outcome_summary) LIKE ?
                OR lower(COALESCE(next_step, '')) LIKE ?
              )
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(input.projectPath, input.sessionID, pattern, pattern, pattern, input.limit) as SummaryRow[])
      : (this.db
          .prepare(`
            SELECT * FROM summaries
            WHERE project_path = ?
              AND (
                lower(request_summary) LIKE ?
                OR lower(outcome_summary) LIKE ?
                OR lower(COALESCE(next_step, '')) LIKE ?
              )
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(input.projectPath, pattern, pattern, pattern, input.limit) as SummaryRow[])

    const observations = !includeObservations
      ? []
      : input.sessionID
      ? (this.db
          .prepare(`
            SELECT * FROM observations
            WHERE project_path = ? AND session_id = ?
              AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
              AND (
                lower(content) LIKE ?
                OR lower(input_summary) LIKE ?
                OR lower(output_summary) LIKE ?
                OR lower(tags_json) LIKE ?
              )
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(
            input.projectPath,
            input.sessionID,
            pattern,
            pattern,
            pattern,
            pattern,
            input.limit,
          ) as ObservationRow[])
      : (this.db
          .prepare(`
            SELECT * FROM observations
            WHERE project_path = ?
              AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
              AND (
                lower(content) LIKE ?
                OR lower(input_summary) LIKE ?
                OR lower(output_summary) LIKE ?
                OR lower(tags_json) LIKE ?
              )
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(input.projectPath, pattern, pattern, pattern, pattern, input.limit) as ObservationRow[])

    const rankedSummaries = [...summaries].sort(
      (a, b) =>
        scoreSummaryRow(b, input.query) - scoreSummaryRow(a, input.query) ||
        b.created_at - a.created_at,
    )

    const summaryRecords: MemorySearchRecord[] = rankedSummaries.map((row) => ({
      kind: "summary",
      id: row.id,
      content: row.outcome_summary,
      createdAt: row.created_at,
      nextStep: row.next_step ?? undefined,
    }))

    const coveredObservationIDs = new Set(
      rankedSummaries.flatMap((row) => parseStringArray(row.observation_ids_json)),
    )

    const rankedObservations = [...observations].sort(
      (a, b) =>
        scoreObservationRow(b, input.query) - scoreObservationRow(a, input.query) ||
        b.importance - a.importance ||
        b.created_at - a.created_at,
    )

    const observationRecords: MemorySearchRecord[] = rankedObservations
      .filter((row) => !coveredObservationIDs.has(row.id))
      .map((row) => ({
        kind: "observation",
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        phase: classifyObservationPhase(mapObservationRow(row)),
        tool: row.tool_name,
        importance: row.importance,
        tags: parseStringArray(row.tags_json),
      }))

    return [...summaryRecords, ...observationRecords].slice(0, input.limit)
  }

  getDetails(ids: string[]): MemoryDetailRecord[] {
    if (ids.length === 0) return []

    const placeholders = ids.map(() => "?").join(", ")
    const summaries = this.db
      .prepare(`
        SELECT * FROM summaries
        WHERE id IN (${placeholders})
        ORDER BY created_at ASC
      `)
      .all(...ids) as SummaryRow[]

    const observations = this.db
      .prepare(`
        SELECT * FROM observations
        WHERE id IN (${placeholders})
        ORDER BY created_at ASC
      `)
      .all(...ids) as ObservationRow[]

    const coveredObservationIDs = Array.from(
      new Set(summaries.flatMap((row) => parseStringArray(row.observation_ids_json))),
    )

    const coveredObservationRows =
      coveredObservationIDs.length > 0
        ? (this.db
            .prepare(`
              SELECT * FROM observations
              WHERE id IN (${coveredObservationIDs.map(() => "?").join(", ")})
              ORDER BY created_at ASC
            `)
            .all(...coveredObservationIDs) as ObservationRow[])
        : []

    const coveredObservationMap = new Map(
      coveredObservationRows.map((row) => [row.id, mapObservationDetailRow(row)]),
    )

    return [
      ...summaries.map((row) => ({
        kind: "summary" as const,
        id: row.id,
        content: row.outcome_summary,
        createdAt: row.created_at,
        requestSummary: row.request_summary,
        nextStep: row.next_step ?? undefined,
        observationIDs: parseStringArray(row.observation_ids_json),
        coveredObservations: parseStringArray(row.observation_ids_json)
          .map((id) => coveredObservationMap.get(id))
          .filter((value): value is MemoryObservationDetailRecord => Boolean(value)),
      })),
      ...observations.map((row) => mapObservationDetailRow(row)),
    ]
  }

  getTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): MemoryTimelineResult | null {
    const anchor = this.resolveTimelineAnchor(input)
    if (!anchor) return null

    const summaries = this.listTimelineSummaries(input)
    const allCoveredObservationIDs = new Set(
      summaries.flatMap((row) => parseStringArray(row.observation_ids_json)),
    )

    const observations = this.listTimelineObservations(input)
      .filter((row) => row.id === anchor.id || !allCoveredObservationIDs.has(row.id))

    const items = [
      ...summaries.map((row) => mapTimelineSummaryRow(row, row.id === anchor.id)),
      ...observations.map((row) => mapTimelineObservationRow(row, row.id === anchor.id)),
    ].sort((a, b) => a.createdAt - b.createdAt || compareTimelineKinds(a.kind, b.kind))

    const anchorIndex = items.findIndex((item) => item.id === anchor.id && item.kind === anchor.kind)
    if (anchorIndex === -1) return null

    const start = Math.max(0, anchorIndex - input.depthBefore)
    const end = Math.min(items.length, anchorIndex + input.depthAfter + 1)

    return {
      anchor: items[anchorIndex]!,
      items: items.slice(start, end),
    }
  }

  private resolveTimelineAnchor(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
  }): MemoryTimelineItem | null {
    if (input.anchorID) {
      const explicit = this.getDetails([input.anchorID])[0]
      if (!explicit) return null
      if (input.sessionID && !this.belongsToSession(explicit.kind, explicit.id, input.sessionID)) {
        return null
      }

      return explicit.kind === "summary"
        ? {
            kind: "summary",
            id: explicit.id,
            content: explicit.content,
            createdAt: explicit.createdAt,
            requestSummary: this.getSummaryRequestSummary(explicit.id) ?? "",
            nextStep: explicit.nextStep,
            isAnchor: true,
          }
        : {
            kind: "observation",
            id: explicit.id,
            content: explicit.content,
            createdAt: explicit.createdAt,
            phase: explicit.phase,
            tool: explicit.tool,
            importance: explicit.importance,
            tags: explicit.tags,
            evidence: mapObservationEvidence(explicit.trace),
            isAnchor: true,
          }
    }

    if (!input.query) return null

    const result = this.searchRecords({
      projectPath: input.projectPath,
      sessionID: input.sessionID,
      query: input.query,
      limit: 1,
    })[0]

    if (!result) return null

    return result.kind === "summary"
      ? {
          kind: "summary",
          id: result.id,
          content: result.content,
          createdAt: result.createdAt,
          requestSummary: this.getSummaryRequestSummary(result.id) ?? "",
          nextStep: result.nextStep,
          isAnchor: true,
        }
      : {
          kind: "observation",
          id: result.id,
          content: result.content,
          createdAt: result.createdAt,
          phase: result.phase,
          tool: result.tool,
          importance: result.importance,
          tags: result.tags,
          evidence: {
            workingDirectory: undefined,
            filesRead: undefined,
            filesModified: undefined,
            command: undefined,
          },
          isAnchor: true,
        }
  }

  private listTimelineSummaries(input: {
    projectPath: string
    sessionID?: string
  }): SummaryRow[] {
    if (input.sessionID) {
      return this.db
        .prepare(`
          SELECT * FROM summaries
          WHERE project_path = ? AND session_id = ?
          ORDER BY created_at ASC
        `)
        .all(input.projectPath, input.sessionID) as SummaryRow[]
    }

    return this.db
      .prepare(`
        SELECT * FROM summaries
        WHERE project_path = ?
        ORDER BY created_at ASC
      `)
      .all(input.projectPath) as SummaryRow[]
  }

  private listTimelineObservations(input: {
    projectPath: string
    sessionID?: string
  }): ObservationRow[] {
    if (input.sessionID) {
      return this.db
        .prepare(`
          SELECT * FROM observations
          WHERE project_path = ? AND session_id = ?
            AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
          ORDER BY created_at ASC
        `)
        .all(input.projectPath, input.sessionID) as ObservationRow[]
    }

    return this.db
      .prepare(`
        SELECT * FROM observations
        WHERE project_path = ?
          AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
        ORDER BY created_at ASC
      `)
      .all(input.projectPath) as ObservationRow[]
  }

  private belongsToSession(kind: "summary" | "observation", id: string, sessionID: string): boolean {
    const row =
      kind === "summary"
        ? (this.db
            .prepare(`SELECT session_id FROM summaries WHERE id = ? LIMIT 1`)
            .get(id) as { session_id: string } | null)
        : (this.db
            .prepare(`SELECT session_id FROM observations WHERE id = ? LIMIT 1`)
            .get(id) as { session_id: string } | null)

    return row?.session_id === sessionID
  }

  private getSummaryRequestSummary(id: string): string | null {
    const row = this.db
      .prepare(`SELECT request_summary FROM summaries WHERE id = ? LIMIT 1`)
      .get(id) as { request_summary: string } | null

    return row?.request_summary ?? null
  }
}
