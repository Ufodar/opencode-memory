import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { Database } from "bun:sqlite"
import { INTERNAL_TOOL_SQL_LIST } from "./types.js"
import { summarizeLegacyReadRow } from "./mappers.js"

export class SQLiteMemoryDatabase {
  readonly handle: Database

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.handle = new Database(dbPath)
    this.init()
  }

  close() {
    this.handle.close()
  }

  private init() {
    this.handle.exec(`
      CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        session_id TEXT NOT NULL,
        project_path TEXT NOT NULL,
        prompt_id TEXT,
        created_at INTEGER NOT NULL,
        phase TEXT,
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

      CREATE TABLE IF NOT EXISTS pending_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        started_processing_at INTEGER,
        updated_at INTEGER NOT NULL,
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_pending_jobs_session_status_id
      ON pending_jobs(session_id, status, id ASC);

      CREATE INDEX IF NOT EXISTS idx_pending_jobs_status_updated
      ON pending_jobs(status, updated_at DESC);
    `)

    this.ensureColumn("observations", "phase", "TEXT")
    this.ensureColumn("request_anchors", "last_checkpoint_observation_at", "INTEGER")
    this.ensureColumn("pending_jobs", "started_processing_at", "INTEGER")
    this.cleanupLegacyObservationNoise()
  }

  private ensureColumn(table: string, column: string, definition: string) {
    const rows = this.handle.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    if (rows.some((row) => row.name === column)) return
    this.handle.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }

  private cleanupLegacyObservationNoise() {
    this.handle
      .prepare(`DELETE FROM observations WHERE tool_name IN (${INTERNAL_TOOL_SQL_LIST})`)
      .run()

    const legacyReadRows = this.handle
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

    const update = this.handle.prepare(`
      UPDATE observations
      SET content = ?, output_summary = ?
      WHERE id = ?
    `)

    for (const row of legacyReadRows) {
      const normalized = summarizeLegacyReadRow(row.tool_title, row.content, row.output_summary)
      update.run(normalized, normalized, row.id)
    }
  }
}
