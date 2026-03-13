import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { Database } from "bun:sqlite"

import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"

interface ObservationRow {
  id: string
  content: string
  session_id: string
  project_path: string
  prompt_id: string | null
  created_at: number
  tool_name: string
  call_id: string
  tool_title: string | null
  tool_status: string
  input_summary: string
  output_summary: string
  importance: number
  tags_json: string
  trace_json: string
}

interface RequestAnchorRow {
  id: string
  session_id: string
  project_path: string
  content: string
  created_at: number
  summarized_at: number | null
  last_checkpoint_observation_at: number | null
}

interface SummaryRow {
  id: string
  session_id: string
  project_path: string
  request_anchor_id: string
  request_summary: string
  outcome_summary: string
  next_step: string | null
  observation_ids_json: string
  created_at: number
}

const INTERNAL_CONTINUITY_TOOLS = ["memory_search", "memory_timeline", "memory_details"] as const
const INTERNAL_TOOL_SQL_LIST = INTERNAL_CONTINUITY_TOOLS.map((tool) => `'${tool}'`).join(", ")

export type ContinuitySearchRecord =
  | {
      kind: "summary"
      id: string
      content: string
      createdAt: number
      nextStep?: string
    }
  | {
      kind: "observation"
      id: string
      content: string
      createdAt: number
      tool: string
      importance: number
      tags: string[]
    }

export type ContinuityTimelineItem =
  | {
      kind: "summary"
      id: string
      content: string
      createdAt: number
      requestSummary: string
      nextStep?: string
      isAnchor: boolean
    }
  | {
      kind: "observation"
      id: string
      content: string
      createdAt: number
      tool: string
      importance: number
      tags: string[]
      isAnchor: boolean
    }

export class ContinuityStore {
  private readonly db: Database

  constructor(private readonly dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    this.init()
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        session_id TEXT NOT NULL,
        project_path TEXT NOT NULL,
        prompt_id TEXT,
        created_at INTEGER NOT NULL,
        tool_name TEXT NOT NULL,
        call_id TEXT NOT NULL,
        tool_title TEXT,
        tool_status TEXT NOT NULL,
        input_summary TEXT NOT NULL,
        output_summary TEXT NOT NULL,
        importance REAL NOT NULL,
        tags_json TEXT NOT NULL,
        trace_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_observations_project_created
      ON observations(project_path, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_observations_session_created
      ON observations(session_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS request_anchors (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        project_path TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        summarized_at INTEGER,
        last_checkpoint_observation_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_request_anchors_project_session_created
      ON request_anchors(project_path, session_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        project_path TEXT NOT NULL,
        request_anchor_id TEXT NOT NULL,
        request_summary TEXT NOT NULL,
        outcome_summary TEXT NOT NULL,
        next_step TEXT,
        observation_ids_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_summaries_project_created
      ON summaries(project_path, created_at DESC);
    `)

    this.ensureColumn("request_anchors", "last_checkpoint_observation_at", "INTEGER")
    this.cleanupLegacyObservationNoise()
  }

  saveObservation(record: ObservationRecord) {
    const statement = this.db.prepare(`
      INSERT OR REPLACE INTO observations (
        id, content, session_id, project_path, prompt_id, created_at,
        tool_name, call_id, tool_title, tool_status,
        input_summary, output_summary, importance, tags_json, trace_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    statement.run(
      record.id,
      record.content,
      record.sessionID,
      record.projectPath,
      record.promptId ?? null,
      record.createdAt,
      record.tool.name,
      record.tool.callID,
      record.tool.title ?? null,
      record.tool.status,
      record.input.summary,
      record.output.summary,
      record.retrieval.importance,
      JSON.stringify(record.retrieval.tags),
      JSON.stringify(record.trace),
    )
  }

  saveRequestAnchor(record: RequestAnchorRecord) {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO request_anchors (
          id, session_id, project_path, content, created_at, summarized_at, last_checkpoint_observation_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        record.id,
        record.sessionID,
        record.projectPath,
        record.content,
        record.createdAt,
        record.summarizedAt ?? null,
        record.lastCheckpointObservationAt ?? null,
      )
  }

  getLatestRequestAnchor(input: {
    projectPath: string
    sessionID: string
  }): RequestAnchorRecord | null {
    const row = this.db
      .prepare(`
        SELECT * FROM request_anchors
        WHERE project_path = ? AND session_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(input.projectPath, input.sessionID) as RequestAnchorRow | null

    return row ? this.mapRequestAnchor(row) : null
  }

  updateRequestAnchorCheckpoint(input: {
    id: string
    summarizedAt: number
    lastCheckpointObservationAt: number
  }) {
    this.db
      .prepare(`
        UPDATE request_anchors
        SET summarized_at = ?, last_checkpoint_observation_at = ?
        WHERE id = ?
      `)
      .run(input.summarizedAt, input.lastCheckpointObservationAt, input.id)
  }

  listRecentObservations(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): ObservationRecord[] {
    if (input.sessionID) {
      const rows = this.db
        .prepare(`
        SELECT * FROM observations
        WHERE project_path = ? AND session_id = ?
          AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
        ORDER BY created_at DESC
        LIMIT ?
      `)
        .all(input.projectPath, input.sessionID, input.limit) as ObservationRow[]

      return rows.map((row) => this.mapObservation(row))
    }

    const rows = this.db
      .prepare(`
      SELECT * FROM observations
      WHERE project_path = ?
        AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
      ORDER BY created_at DESC
      LIMIT ?
    `)
      .all(input.projectPath, input.limit) as ObservationRow[]

    return rows.map((row) => this.mapObservation(row))
  }

  searchObservations(input: {
    projectPath: string
    query: string
    limit: number
  }): ObservationRecord[] {
    const pattern = `%${input.query.toLowerCase()}%`
    const rows = this.db
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
      .all(input.projectPath, pattern, pattern, pattern, pattern, input.limit) as ObservationRow[]

    return rows.map((row) => this.mapObservation(row))
  }

  getObservationsByIds(ids: string[]): ObservationRecord[] {
    if (ids.length === 0) return []

    const placeholders = ids.map(() => "?").join(", ")
    const rows = this.db
      .prepare(`
        SELECT * FROM observations
        WHERE id IN (${placeholders})
        ORDER BY created_at ASC
      `)
      .all(...ids) as ObservationRow[]

    return rows.map((row) => this.mapObservation(row))
  }

  listObservationsForRequestWindow(input: {
    projectPath: string
    sessionID: string
    afterCreatedAtExclusive: number
    limit?: number
  }): ObservationRecord[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM observations
        WHERE project_path = ? AND session_id = ? AND created_at > ?
          AND tool_name NOT IN (${INTERNAL_TOOL_SQL_LIST})
        ORDER BY created_at ASC
        LIMIT ?
      `)
      .all(
        input.projectPath,
        input.sessionID,
        input.afterCreatedAtExclusive,
        input.limit ?? 20,
      ) as ObservationRow[]

    return rows.map((row) => this.mapObservation(row))
  }

  saveSummary(record: SummaryRecord) {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO summaries (
          id, session_id, project_path, request_anchor_id,
          request_summary, outcome_summary, next_step,
          observation_ids_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        record.id,
        record.sessionID,
        record.projectPath,
        record.requestAnchorID,
        record.requestSummary,
        record.outcomeSummary,
        record.nextStep ?? null,
        JSON.stringify(record.observationIDs),
        record.createdAt,
      )
  }

  listRecentSummaries(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): SummaryRecord[] {
    if (input.sessionID) {
      const rows = this.db
        .prepare(`
          SELECT * FROM summaries
          WHERE project_path = ? AND session_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .all(input.projectPath, input.sessionID, input.limit) as SummaryRow[]

      return rows.map((row) => this.mapSummary(row))
    }

    const rows = this.db
      .prepare(`
        SELECT * FROM summaries
        WHERE project_path = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(input.projectPath, input.limit) as SummaryRow[]

    return rows.map((row) => this.mapSummary(row))
  }

  searchContinuityRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }): ContinuitySearchRecord[] {
    const pattern = `%${input.query.toLowerCase()}%`
    const summaries = input.sessionID
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

    const observations = input.sessionID
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

    const summaryRecords: ContinuitySearchRecord[] = rankedSummaries.map((row) => ({
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

    const observationRecords: ContinuitySearchRecord[] = rankedObservations
      .filter((row) => !coveredObservationIDs.has(row.id))
      .map((row) => ({
        kind: "observation",
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        tool: row.tool_name,
        importance: row.importance,
        tags: parseStringArray(row.tags_json),
      }))

    return [...summaryRecords, ...observationRecords].slice(0, input.limit)
  }

  getContinuityDetails(ids: string[]): ContinuitySearchRecord[] {
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

    return [
      ...summaries.map((row) => ({
        kind: "summary" as const,
        id: row.id,
        content: row.outcome_summary,
        createdAt: row.created_at,
        nextStep: row.next_step ?? undefined,
      })),
      ...observations.map((row) => ({
        kind: "observation" as const,
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        tool: row.tool_name,
        importance: row.importance,
        tags: parseStringArray(row.tags_json),
      })),
    ]
  }

  getContinuityTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): {
    anchor: ContinuityTimelineItem
    items: ContinuityTimelineItem[]
  } | null {
    const anchor = this.resolveTimelineAnchor(input)
    if (!anchor) return null

    const summaries = this.listTimelineSummaries(input)
    const allCoveredObservationIDs = new Set(
      summaries.flatMap((row) => parseStringArray(row.observation_ids_json)),
    )

    const observations = this.listTimelineObservations(input)
      .filter((row) => row.id === anchor.id || !allCoveredObservationIDs.has(row.id))

    const items = [
      ...summaries.map((row) => this.mapTimelineSummary(row, row.id === anchor.id)),
      ...observations.map((row) => this.mapTimelineObservation(row, row.id === anchor.id)),
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

  close() {
    this.db.close()
  }

  private resolveTimelineAnchor(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
  }): ContinuityTimelineItem | null {
    if (input.anchorID) {
      const explicit = this.getContinuityDetails([input.anchorID])[0]
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
            tool: explicit.tool,
            importance: explicit.importance,
            tags: explicit.tags,
            isAnchor: true,
          }
    }

    if (!input.query) return null

    const result = this.searchContinuityRecords({
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
          tool: result.tool,
          importance: result.importance,
          tags: result.tags,
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

  private mapTimelineSummary(row: SummaryRow, isAnchor: boolean): ContinuityTimelineItem {
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

  private mapTimelineObservation(row: ObservationRow, isAnchor: boolean): ContinuityTimelineItem {
    return {
      kind: "observation",
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      tool: row.tool_name,
      importance: row.importance,
      tags: parseStringArray(row.tags_json),
      isAnchor,
    }
  }

  private mapObservation(row: ObservationRow): ObservationRecord {
    return {
      id: row.id,
      content: row.content,
      sessionID: row.session_id,
      projectPath: row.project_path,
      promptId: row.prompt_id ?? undefined,
      createdAt: row.created_at,
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

  private mapRequestAnchor(row: RequestAnchorRow): RequestAnchorRecord {
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

  private ensureColumn(table: string, column: string, definition: string) {
    const rows = this.db.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    if (rows.some((row) => row.name === column)) return
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }

  private cleanupLegacyObservationNoise() {
    this.db
      .prepare(
        `DELETE FROM observations WHERE tool_name IN (${INTERNAL_TOOL_SQL_LIST})`,
      )
      .run()

    const legacyReadRows = this.db
      .prepare(`
        SELECT id, content, output_summary, tool_title
        FROM observations
        WHERE tool_name = 'read'
          AND (
            content LIKE '<path>%'
            OR output_summary LIKE '<path>%'
          )
      `)
      .all() as Array<{
      id: string
      content: string
      output_summary: string
      tool_title: string | null
    }>

    const update = this.db.prepare(`
      UPDATE observations
      SET content = ?, output_summary = ?
      WHERE id = ?
    `)

    for (const row of legacyReadRows) {
      const normalized = summarizeLegacyReadRow(row.tool_title, row.content, row.output_summary)
      update.run(normalized, normalized, row.id)
    }
  }

  private mapSummary(row: SummaryRow): SummaryRecord {
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
}

function compareTimelineKinds(a: "summary" | "observation", b: "summary" | "observation") {
  if (a === b) return 0
  return a === "observation" ? -1 : 1
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function parseTrace(value: string): ObservationRecord["trace"] {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeStatus(value: string): ObservationRecord["tool"]["status"] {
  if (value === "success" || value === "error" || value === "unknown") return value
  return "unknown"
}

function summarizeLegacyReadRow(
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

function scoreSummaryRow(row: SummaryRow, query: string): number {
  const q = query.toLowerCase()
  let score = 0

  if (row.outcome_summary.toLowerCase().includes(q)) score += 30
  if (row.request_summary.toLowerCase().includes(q)) score += 10
  if ((row.next_step ?? "").toLowerCase().includes(q)) score += 5

  return score
}

function scoreObservationRow(row: ObservationRow, query: string): number {
  const q = query.toLowerCase()
  let score = 0

  if (row.content.toLowerCase().includes(q)) score += 30
  if (row.output_summary.toLowerCase().includes(q)) score += 10
  if (row.input_summary.toLowerCase().includes(q)) score += 5
  if (row.tags_json.toLowerCase().includes(q)) score += 3

  return score
}
