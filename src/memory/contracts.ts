import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"

export type MemorySearchRecord =
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

export type MemoryObservationDetailRecord = {
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

export type MemoryObservationEvidence = Pick<
  ObservationRecord["trace"],
  "workingDirectory" | "filesRead" | "filesModified" | "command"
>

export type MemoryDetailRecord =
  | {
      kind: "summary"
      id: string
      content: string
      createdAt: number
      requestSummary: string
      nextStep?: string
      observationIDs: string[]
      coveredObservations: MemoryObservationDetailRecord[]
    }
  | MemoryObservationDetailRecord

export type MemoryTimelineItem =
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
      evidence: MemoryObservationEvidence
      isAnchor: boolean
    }

export interface MemorySearchStore {
  searchMemoryRecords(input: {
    projectPath: string
    sessionID?: string
    query: string
    limit: number
    kinds?: Array<MemorySearchRecord["kind"]>
    phase?: ObservationRecord["phase"]
  }): MemorySearchRecord[]
}

export type MemoryQueueFailedJob = {
  id: number
  sessionID: string
  kind: "request-anchor" | "observation" | "session-idle"
  attemptCount: number
  lastError: string | null
  updatedAt: number
}

export type MemoryQueueProcessingJob = {
  id: number
  sessionID: string
  kind: "request-anchor" | "observation" | "session-idle"
  attemptCount: number
  startedProcessingAt: number
  updatedAt: number
  lastError: string | null
  isStale: boolean
}

export type MemoryWorkerStatusEvent = {
  type:
    | "enqueue"
    | "start"
    | "complete"
    | "fail"
    | "resume"
    | "worker-started"
    | "worker-stopped"
    | "session-complete"
  sessionID?: string
  jobID?: number
  kind?: "request-anchor" | "observation" | "session-idle"
  failureStatus?: "pending" | "failed"
}

export type MemoryWorkerSessionCompletion = {
  sessionID: string
  completedAt: number
  summaryStatus: "busy" | "missing-request" | "no-op" | "summarized" | "queued"
  requestAnchorID?: string
  summaryID?: string
  checkpointObservationAt?: number
}

export type MemoryWorkerStatusSnapshot = {
  updatedAt: number
  isProcessing: boolean
  queueDepth: number
  counts: {
    pending: number
    processing: number
    failed: number
  }
  activeSessionIDs: string[]
  lastEvent: MemoryWorkerStatusEvent
  lastSessionCompletion?: MemoryWorkerSessionCompletion
}

export interface MemoryQueueStore {
  getQueueStats(): {
    pending: number
    processing: number
    failed: number
  }
  listProcessingJobs(limit: number): MemoryQueueProcessingJob[]
  listFailedJobs(limit: number): MemoryQueueFailedJob[]
  retryJob(id: number): boolean
}

export interface MemoryDetailsStore {
  getMemoryDetails(ids: string[]): MemoryDetailRecord[]
}

export interface MemoryTimelineStore {
  getMemoryTimeline(input: {
    projectPath: string
    sessionID?: string
    anchorID?: string
    query?: string
    depthBefore: number
    depthAfter: number
  }): MemoryTimelineResult | null
}

export interface MemoryInjectionStore {
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
  getObservationsByIds(ids: string[]): ObservationRecord[]
}

export interface MemoryIdleSummaryStore {
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

export interface MemoryTimelineResult {
  anchor: MemoryTimelineItem
  items: MemoryTimelineItem[]
}
