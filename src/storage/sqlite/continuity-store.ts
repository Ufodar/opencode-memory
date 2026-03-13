import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { Database } from "bun:sqlite"

import type { ObservationRecord } from "../../memory/observation/types.js"

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
    `)
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
