import type {
  MemoryDetailRecord,
  MemoryDetailsStore,
  MemoryIdleSummaryStore,
  MemoryInjectionStore,
  MemorySearchRecord,
  MemorySearchStore,
  MemoryTimelineItem,
  MemoryTimelineResult,
  MemoryTimelineStore,
} from "../../memory/contracts.js"
import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import { ObservationRepository } from "./observation-repository.js"
import { PendingJobRepository } from "./pending-job-repository.js"
import { RequestAnchorRepository } from "./request-anchor-repository.js"
import { MemoryRetrievalService } from "./retrieval-query-service.js"
import { SQLiteMemoryDatabase } from "./sqlite-memory-database.js"
import { SummaryRepository } from "./summary-repository.js"
import type {
  PendingJobEnqueueInput,
  PendingJobRecord,
} from "../../worker/pending-jobs.js"

export type {
  MemorySearchRecord,
  MemoryDetailRecord,
  MemoryObservationDetailRecord,
  MemoryTimelineItem,
} from "../../memory/contracts.js"

export class SQLiteMemoryStore
  implements
    MemoryIdleSummaryStore,
    MemoryInjectionStore,
    MemorySearchStore,
    MemoryDetailsStore,
    MemoryTimelineStore
{
  private readonly database: SQLiteMemoryDatabase
  private readonly observations: ObservationRepository
  private readonly pendingJobs: PendingJobRepository
  private readonly requestAnchors: RequestAnchorRepository
  private readonly summaries: SummaryRepository
  private readonly retrieval: MemoryRetrievalService

  constructor(dbPathOrDatabase: string | SQLiteMemoryDatabase) {
    this.database =
      typeof dbPathOrDatabase === "string"
        ? new SQLiteMemoryDatabase(dbPathOrDatabase)
        : dbPathOrDatabase
    this.observations = new ObservationRepository(this.database.handle)
    this.pendingJobs = new PendingJobRepository(this.database.handle)
    this.requestAnchors = new RequestAnchorRepository(this.database.handle)
    this.summaries = new SummaryRepository(this.database.handle)
    this.retrieval = new MemoryRetrievalService(this.database.handle)
  }

  getDatabaseHandle() {
    return this.database.handle
  }

  saveObservation(record: ObservationRecord) {
    this.observations.save(record)
  }

  saveRequestAnchor(record: RequestAnchorRecord) {
    this.requestAnchors.save(record)
  }

  getLatestRequestAnchor(input: {
    projectPath: string
    sessionID: string
  }): RequestAnchorRecord | null {
    return this.requestAnchors.getLatest(input)
  }

  updateRequestAnchorCheckpoint(input: {
    id: string
    summarizedAt: number
    lastCheckpointObservationAt: number
  }) {
    this.requestAnchors.updateCheckpoint(input)
  }

  listRecentObservations(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): ObservationRecord[] {
    return this.observations.listRecent(input)
  }

  searchObservations(input: {
    projectPath: string
    query: string
    limit: number
  }): ObservationRecord[] {
    return this.observations.search(input)
  }

  getObservationsByIds(ids: string[]): ObservationRecord[] {
    return this.observations.getByIds(ids)
  }

  listObservationsForRequestWindow(input: {
    projectPath: string
    sessionID: string
    afterCreatedAtExclusive: number
    limit?: number
  }): ObservationRecord[] {
    return this.observations.listForRequestWindow(input)
  }

  saveSummary(record: SummaryRecord) {
    this.summaries.save(record)
  }

  listRecentSummaries(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): SummaryRecord[] {
    return this.summaries.listRecent(input)
  }

  searchMemoryRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
    kinds?: Array<MemorySearchRecord["kind"]>
    phase?: ObservationRecord["phase"]
  }): MemorySearchRecord[] {
    return this.retrieval.searchRecords(input)
  }

  getMemoryDetails(ids: string[]): MemoryDetailRecord[] {
    return this.retrieval.getDetails(ids)
  }

  getMemoryTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): MemoryTimelineResult | null {
    return this.retrieval.getTimeline(input)
  }

  enqueuePendingJob(input: PendingJobEnqueueInput) {
    return this.pendingJobs.enqueue(input)
  }

  claimNextPendingJob(sessionID: string): PendingJobRecord | null {
    return this.pendingJobs.claimNext(sessionID)
  }

  completePendingJob(id: number) {
    this.pendingJobs.complete(id)
  }

  recordPendingJobFailure(id: number, error: string): "pending" | "failed" {
    return this.pendingJobs.recordFailure(id, error)
  }

  listSessionIDsWithPendingJobs(): string[] {
    return this.pendingJobs.listSessionIDsWithPendingJobs()
  }

  hasOutstandingPendingJobs(sessionID: string): boolean {
    return this.pendingJobs.hasOutstandingJobs(sessionID)
  }

  resetProcessingPendingJobs(): number {
    return this.pendingJobs.resetProcessingToPending()
  }

  getQueueStats() {
    const pending = this.database.handle
      .prepare(`SELECT COUNT(*) as count FROM pending_jobs WHERE status = 'pending'`)
      .get() as { count: number }
    const processing = this.database.handle
      .prepare(`SELECT COUNT(*) as count FROM pending_jobs WHERE status = 'processing'`)
      .get() as { count: number }
    const failed = this.database.handle
      .prepare(`SELECT COUNT(*) as count FROM pending_jobs WHERE status = 'failed'`)
      .get() as { count: number }

    return {
      pending: pending.count,
      processing: processing.count,
      failed: failed.count,
    }
  }

  listFailedJobs(limit: number) {
    return this.pendingJobs.listFailedJobs(limit)
  }

  listProcessingJobs(limit: number) {
    return this.pendingJobs.listProcessingJobs(limit)
  }

  retryJob(id: number) {
    return this.pendingJobs.retryJob(id)
  }

  close() {
    this.database.close()
  }
}

export { SQLiteMemoryStore as MemoryStore }
