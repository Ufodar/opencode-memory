import type { Database } from "bun:sqlite"
import type { ObservationRecord } from "../../memory/observation/types.js"
import { mapObservationRow } from "./mappers.js"
import { INTERNAL_TOOL_SQL_LIST, type ObservationRow } from "./types.js"

export class ObservationRepository {
  constructor(private readonly db: Database) {}

  save(record: ObservationRecord) {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO observations (
          id, content, session_id, project_path, prompt_id, created_at,
          phase,
          tool_name, call_id, tool_title, tool_status,
          input_summary, output_summary, importance, tags_json, trace_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        record.id,
        record.content,
        record.sessionID,
        record.projectPath,
        record.promptId ?? null,
        record.createdAt,
        record.phase ?? null,
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

  listRecent(input: {
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

      return rows.map(mapObservationRow)
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

    return rows.map(mapObservationRow)
  }

  search(input: {
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

    return rows.map(mapObservationRow)
  }

  getByIds(ids: string[]): ObservationRecord[] {
    if (ids.length === 0) return []

    const rows = this.db
      .prepare(`
        SELECT * FROM observations
        WHERE id IN (${ids.map(() => "?").join(", ")})
        ORDER BY created_at ASC
      `)
      .all(...ids) as ObservationRow[]

    return rows.map(mapObservationRow)
  }

  listForRequestWindow(input: {
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

    return rows.map(mapObservationRow)
  }
}
