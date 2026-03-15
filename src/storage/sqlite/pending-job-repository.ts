import type { Database } from "bun:sqlite"

import type {
  PendingJobEnqueueInput,
  PendingJobKind,
  PendingJobRecord,
  PendingJobStatus,
  PendingJobStore,
} from "../../worker/pending-jobs.js"

type PendingJobRow = {
  id: number
  session_id: string
  kind: PendingJobKind
  payload_json: string
  status: PendingJobStatus
  attempt_count: number
  created_at: number
  updated_at: number
  last_error: string | null
}

export class PendingJobRepository implements PendingJobStore {
  constructor(private readonly db: Database) {}

  enqueue(input: PendingJobEnqueueInput): number {
    const now = Date.now()
    const result = this.db
      .prepare(`
        INSERT INTO pending_jobs (
          session_id, kind, payload_json, status, attempt_count, created_at, updated_at, last_error
        ) VALUES (?, ?, ?, 'pending', 0, ?, ?, NULL)
      `)
      .run(input.sessionID, input.kind, JSON.stringify(input.payload), now, now)

    return Number(result.lastInsertRowid)
  }

  claimNext(sessionID: string): PendingJobRecord | null {
    const row = this.db
      .prepare(`
        SELECT *
        FROM pending_jobs
        WHERE session_id = ? AND status = 'pending'
        ORDER BY id ASC
        LIMIT 1
      `)
      .get(sessionID) as PendingJobRow | null

    if (!row) {
      return null
    }

    const updatedAt = Date.now()
    const result = this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = 'processing',
            attempt_count = attempt_count + 1,
            updated_at = ?
        WHERE id = ? AND status = 'pending'
      `)
      .run(updatedAt, row.id)

    if (result.changes === 0) {
      return null
    }

    return mapPendingJobRow({
      ...row,
      status: "processing",
      attempt_count: row.attempt_count + 1,
      updated_at: updatedAt,
    })
  }

  complete(id: number) {
    this.db.prepare(`DELETE FROM pending_jobs WHERE id = ?`).run(id)
  }

  releaseForRetry(id: number, error: string) {
    this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = 'pending',
            updated_at = ?,
            last_error = ?
        WHERE id = ?
      `)
      .run(Date.now(), error, id)
  }

  listSessionIDsWithPendingJobs(): string[] {
    const rows = this.db
      .prepare(`
        SELECT session_id
        FROM pending_jobs
        WHERE status = 'pending'
        GROUP BY session_id
        ORDER BY MIN(id) ASC
      `)
      .all() as Array<{ session_id: string }>

    return rows.map((row) => row.session_id)
  }

  resetProcessingToPending(): number {
    const result = this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = 'pending',
            updated_at = ?
        WHERE status = 'processing'
      `)
      .run(Date.now())

    return result.changes
  }
}

function mapPendingJobRow(row: PendingJobRow): PendingJobRecord {
  const base = {
    id: row.id,
    sessionID: row.session_id,
    status: row.status,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastError: row.last_error,
  }

  switch (row.kind) {
    case "request-anchor":
      return {
        ...base,
        kind: row.kind,
        payload: JSON.parse(row.payload_json),
      }
    case "observation":
      return {
        ...base,
        kind: row.kind,
        payload: JSON.parse(row.payload_json),
      }
    case "session-idle":
      return {
        ...base,
        kind: row.kind,
        payload: JSON.parse(row.payload_json),
      }
  }
}
