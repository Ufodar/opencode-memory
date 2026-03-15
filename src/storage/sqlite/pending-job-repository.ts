import type { Database } from "bun:sqlite"

import type {
  PendingJobEnqueueInput,
  PendingJobKind,
  PendingJobRecord,
  PendingJobStatus,
  PendingJobStore,
} from "../../worker/pending-jobs.js"
import type {
  MemoryQueueFailedJob,
  MemoryQueueProcessingJob,
} from "../../memory/contracts.js"

type PendingJobRow = {
  id: number
  session_id: string
  kind: PendingJobKind
  payload_json: string
  status: PendingJobStatus
  attempt_count: number
  created_at: number
  started_processing_at: number | null
  updated_at: number
  last_error: string | null
}

export class PendingJobRepository implements PendingJobStore {
  constructor(
    private readonly db: Database,
    private readonly options: {
      maxAttempts?: number
      staleProcessingMs?: number
    } = {},
  ) {}

  enqueue(input: PendingJobEnqueueInput): number {
    const now = Date.now()
    const result = this.db
      .prepare(`
        INSERT INTO pending_jobs (
          session_id, kind, payload_json, status, attempt_count, created_at, started_processing_at, updated_at, last_error
        ) VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, NULL)
      `)
      .run(input.sessionID, input.kind, JSON.stringify(input.payload), now, now)

    return Number(result.lastInsertRowid)
  }

  claimNext(sessionID: string): PendingJobRecord | null {
    this.resetStaleProcessingJobs(sessionID)

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
            started_processing_at = ?,
            updated_at = ?
        WHERE id = ? AND status = 'pending'
      `)
      .run(updatedAt, updatedAt, row.id)

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

  recordFailure(id: number, error: string): "pending" | "failed" {
    const row = this.db
      .prepare(`
        SELECT attempt_count
        FROM pending_jobs
        WHERE id = ?
      `)
      .get(id) as { attempt_count: number } | null

    if (!row) {
      return "failed"
    }

    const status = row.attempt_count >= this.getMaxAttempts() ? "failed" : "pending"

    this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = ?,
            started_processing_at = NULL,
            updated_at = ?,
            last_error = ?
        WHERE id = ?
      `)
      .run(status, Date.now(), error, id)

    return status
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
            started_processing_at = NULL,
            updated_at = ?
        WHERE status = 'processing'
      `)
      .run(Date.now())

    return result.changes
  }

  private getMaxAttempts() {
    return this.options.maxAttempts ?? 3
  }

  private getStaleProcessingMs() {
    return this.options.staleProcessingMs ?? 60_000
  }

  private resetStaleProcessingJobs(sessionID: string) {
    const cutoff = Date.now() - this.getStaleProcessingMs()
    this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = 'pending',
            started_processing_at = NULL,
            updated_at = ?
        WHERE session_id = ?
          AND status = 'processing'
          AND started_processing_at IS NOT NULL
          AND started_processing_at < ?
      `)
      .run(Date.now(), sessionID, cutoff)
  }

  listFailedJobs(limit: number): MemoryQueueFailedJob[] {
    const rows = this.db
      .prepare(`
        SELECT id, session_id, kind, attempt_count, last_error, updated_at
        FROM pending_jobs
        WHERE status = 'failed'
        ORDER BY updated_at DESC, id DESC
        LIMIT ?
      `)
      .all(limit) as Array<{
      id: number
      session_id: string
      kind: PendingJobKind
      attempt_count: number
      last_error: string | null
      updated_at: number
    }>

    return rows.map((row) => ({
      id: row.id,
      sessionID: row.session_id,
      kind: row.kind,
      attemptCount: row.attempt_count,
      lastError: row.last_error,
      updatedAt: row.updated_at,
    }))
  }

  listProcessingJobs(limit: number): MemoryQueueProcessingJob[] {
    const cutoff = Date.now() - this.getStaleProcessingMs()
    const rows = this.db
      .prepare(`
        SELECT id, session_id, kind, attempt_count, started_processing_at, updated_at, last_error
        FROM pending_jobs
        WHERE status = 'processing'
        ORDER BY started_processing_at ASC, id ASC
        LIMIT ?
      `)
      .all(limit) as Array<{
      id: number
      session_id: string
      kind: PendingJobKind
      attempt_count: number
      started_processing_at: number | null
      updated_at: number
      last_error: string | null
    }>

    return rows
      .filter((row) => row.started_processing_at !== null)
      .map((row) => ({
        id: row.id,
        sessionID: row.session_id,
        kind: row.kind,
        attemptCount: row.attempt_count,
        startedProcessingAt: row.started_processing_at as number,
        updatedAt: row.updated_at,
        lastError: row.last_error,
        isStale: (row.started_processing_at as number) < cutoff,
      }))
  }

  retryJob(id: number): boolean {
    const result = this.db
      .prepare(`
        UPDATE pending_jobs
        SET status = 'pending',
            started_processing_at = NULL,
            updated_at = ?,
            last_error = NULL
        WHERE id = ? AND status IN ('failed', 'processing')
      `)
      .run(Date.now(), id)

    return result.changes > 0
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
