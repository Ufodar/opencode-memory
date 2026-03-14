import type {
  ContinuityDetailRecord,
  ContinuityDetailsStore,
  ContinuityIdleSummaryStore,
  ContinuityInjectionStore,
  ContinuitySearchRecord,
  ContinuitySearchStore,
  ContinuityTimelineItem,
  ContinuityTimelineResult,
  ContinuityTimelineStore,
} from "../../continuity/contracts.js"
import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import type { SummaryRecord } from "../../memory/summary/types.js"
import { ObservationRepository } from "./observation-repository.js"
import { RequestAnchorRepository } from "./request-anchor-repository.js"
import { ContinuityRetrievalService } from "./retrieval-query-service.js"
import { SQLiteContinuityDatabase } from "./sqlite-continuity-database.js"
import { SummaryRepository } from "./summary-repository.js"

export type {
  ContinuitySearchRecord,
  ContinuityDetailRecord,
  ContinuityObservationDetailRecord,
  ContinuityTimelineItem,
} from "../../continuity/contracts.js"

export class SQLiteContinuityStore
  implements
    ContinuityIdleSummaryStore,
    ContinuityInjectionStore,
    ContinuitySearchStore,
    ContinuityDetailsStore,
    ContinuityTimelineStore
{
  private readonly database: SQLiteContinuityDatabase
  private readonly observations: ObservationRepository
  private readonly requestAnchors: RequestAnchorRepository
  private readonly summaries: SummaryRepository
  private readonly retrieval: ContinuityRetrievalService

  constructor(dbPath: string) {
    this.database = new SQLiteContinuityDatabase(dbPath)
    this.observations = new ObservationRepository(this.database.handle)
    this.requestAnchors = new RequestAnchorRepository(this.database.handle)
    this.summaries = new SummaryRepository(this.database.handle)
    this.retrieval = new ContinuityRetrievalService(this.database.handle)
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

  searchContinuityRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }): ContinuitySearchRecord[] {
    return this.retrieval.searchRecords(input)
  }

  getContinuityDetails(ids: string[]): ContinuityDetailRecord[] {
    return this.retrieval.getDetails(ids)
  }

  getContinuityTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): ContinuityTimelineResult | null {
    return this.retrieval.getTimeline(input)
  }

  close() {
    this.database.close()
  }
}

export { SQLiteContinuityStore as ContinuityStore }
