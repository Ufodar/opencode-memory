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

    const summaryRecords: ContinuitySearchRecord[] = summaries.map((row) => ({
      kind: "summary",
      id: row.id,
      content: row.outcome_summary,
      createdAt: row.created_at,
      nextStep: row.next_step ?? undefined,
    }))

    const coveredObservationIDs = new Set(
      summaries.flatMap((row) => parseStringArray(row.observation_ids_json)),
    )

    const observationRecords: ContinuitySearchRecord[] = observations
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

  close() {
    this.db.close()
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
