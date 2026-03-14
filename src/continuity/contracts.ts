import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"

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
      phase?: ObservationRecord["phase"]
      tool: string
      importance: number
      tags: string[]
    }

export type ContinuityObservationDetailRecord = {
  kind: "observation"
  id: string
  content: string
  createdAt: number
  phase?: ObservationRecord["phase"]
  tool: string
  importance: number
  tags: string[]
  inputSummary: string
  outputSummary: string
  trace: ObservationRecord["trace"]
}

export type ContinuityDetailRecord =
  | {
      kind: "summary"
      id: string
      content: string
      createdAt: number
      requestSummary: string
      nextStep?: string
      observationIDs: string[]
      coveredObservations: ContinuityObservationDetailRecord[]
    }
  | ContinuityObservationDetailRecord

export type ContinuityTimelineItem =
  | {
      kind: "summary"
      id: string
      content: string
      createdAt: number
      requestSummary: string
      nextStep?: string
      isAnchor: boolean
    }
  | {
      kind: "observation"
      id: string
      content: string
      createdAt: number
      phase?: ObservationRecord["phase"]
      tool: string
      importance: number
      tags: string[]
      isAnchor: boolean
    }

export interface ContinuitySearchStore {
  searchContinuityRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
  }): ContinuitySearchRecord[]
}

export interface ContinuityDetailsStore {
  getContinuityDetails(ids: string[]): ContinuityDetailRecord[]
}

export interface ContinuityTimelineStore {
  getContinuityTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): ContinuityTimelineResult | null
}

export interface ContinuityInjectionStore {
  listRecentSummaries(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): SummaryRecord[]
  listRecentObservations(input: {
    projectPath: string
    sessionID?: string
    limit: number
  }): ObservationRecord[]
}

export interface ContinuityIdleSummaryStore {
  getLatestRequestAnchor(input: {
    projectPath: string
    sessionID: string
  }): RequestAnchorRecord | null
  listObservationsForRequestWindow(input: {
    projectPath: string
    sessionID: string
    afterCreatedAtExclusive: number
    limit?: number
  }): ObservationRecord[]
  saveSummary(summary: SummaryRecord): void
  updateRequestAnchorCheckpoint(input: {
    id: string
    summarizedAt: number
    lastCheckpointObservationAt: number
  }): void
}

export interface ContinuityTimelineResult {
  anchor: ContinuityTimelineItem
  items: ContinuityTimelineItem[]
}
