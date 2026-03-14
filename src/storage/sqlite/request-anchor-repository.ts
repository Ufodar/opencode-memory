import type { Database } from "bun:sqlite"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import { mapRequestAnchorRow } from "./mappers.js"
import type { RequestAnchorRow } from "./types.js"

export class RequestAnchorRepository {
  constructor(private readonly db: Database) {}

  save(record: RequestAnchorRecord) {
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

  getLatest(input: {
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

    return row ? mapRequestAnchorRow(row) : null
  }

  updateCheckpoint(input: {
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
}
