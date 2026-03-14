import type { Database } from "bun:sqlite"
import type { SummaryRecord } from "../../memory/summary/types.js"
import { mapSummaryRow } from "./mappers.js"
import type { SummaryRow } from "./types.js"

export class SummaryRepository {
  constructor(private readonly db: Database) {}

  save(record: SummaryRecord) {
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

  listRecent(input: {
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

      return rows.map(mapSummaryRow)
    }

    const rows = this.db
      .prepare(`
        SELECT * FROM summaries
        WHERE project_path = ?
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(input.projectPath, input.limit) as SummaryRow[]

    return rows.map(mapSummaryRow)
  }
}
