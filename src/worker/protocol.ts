import type {
  MemoryDetailRecord,
  MemoryQueueFailedJob,
  MemoryQueueProcessingJob,
  MemorySearchRecord,
  MemoryTimelineResult,
  MemoryWorkerStatusSnapshot,
} from "../memory/contracts.js"
import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"

export interface WorkerAcceptedResponse {
  accepted: true
}

export interface CaptureRequestAnchorRequest {
  sessionID: string
  messageID?: string
  text: string
}

export type CaptureRequestAnchorResponse = RequestAnchorRecord | null

export interface CaptureObservationRequest {
  toolInput: {
    tool: string
    sessionID: string
    callID: string
    args: unknown
  }
  output: {
    title: string
    output: string
    metadata: Record<string, unknown>
  }
}

export type CaptureObservationResponse = ObservationRecord | null

export interface IdleSummaryRequest {
  sessionID: string
}

export type IdleSummaryResult =
  | { status: "busy" }
  | { status: "missing-request" }
  | { status: "no-op"; requestAnchorID?: string }
  | {
      status: "summarized"
      requestAnchorID: string
      summaryID: string
      checkpointObservationAt: number
    }

export type IdleSummaryResponse = WorkerAcceptedResponse | IdleSummaryResult

export interface SessionCompleteRequest {
  sessionID: string
}

export interface SessionCompleteResponse {
  status: "completed"
  sessionID: string
  summaryStatus: "busy" | "missing-request" | "no-op" | "summarized" | "queued"
  requestAnchorID?: string
  summaryID?: string
  checkpointObservationAt?: number
}

export interface SelectInjectionRequest {
  sessionID?: string
  maxSummaries: number
  maxObservations: number
}

export interface SelectInjectionResponse {
  scope: "session" | "project"
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
}

export interface BuildSystemContextRequest {
  sessionID?: string
  maxSummaries: number
  maxObservations: number
  maxChars: number
  priorAssistantMessage?: string
}

export type BuildSystemContextResponse = string[]

export interface BuildCompactionContextRequest {
  sessionID?: string
  maxSummaries: number
  maxObservations: number
  maxChars: number
}

export type BuildCompactionContextResponse = string[]

export interface SearchMemoryRequest {
  sessionID?: string
  query: string
  limit: number
  scope?: "session" | "project"
}

export interface SearchMemoryResponse {
  scope: "session" | "project"
  results: MemorySearchRecord[]
}

export interface TimelineMemoryRequest {
  sessionID?: string
  anchorID?: string
  query?: string
  depthBefore: number
  depthAfter: number
  scope?: "session" | "project"
}

export type TimelineMemoryResponse =
  | {
      scope: "session" | "project"
      timeline: MemoryTimelineResult
    }
  | null

export interface MemoryDetailsRequest {
  ids: string[]
}

export type MemoryDetailsResponse = MemoryDetailRecord[]

export interface QueueStatusRequest {
  limit: number
}

export interface QueueStatusResponse {
  isProcessing: boolean
  queueDepth: number
  counts: {
    pending: number
    processing: number
    failed: number
  }
  workerStatus: MemoryWorkerStatusSnapshot | null
  processingJobs: MemoryQueueProcessingJob[]
  failedJobs: MemoryQueueFailedJob[]
}

export interface QueueRetryRequest {
  jobID: number
}

export interface QueueRetryResponse {
  retried: boolean
  jobID: number
}

export interface WorkerHealthResponse {
  ok: true
  version: string
}

export interface MemoryWorkerSnapshotRequest {
  sessionID?: string
  maxSummaries: number
  maxObservations: number
  queueLimit: number
}

export interface MemoryWorkerSnapshotResponse {
  scope: "session" | "project"
  summaries: SummaryRecord[]
  observations: ObservationRecord[]
  queue: QueueStatusResponse
}

export type MemoryWorkerStreamEvent =
  | {
      type: "connected"
      timestamp: number
    }
  | {
      type: "new_observation"
      timestamp: number
      observation: ObservationRecord
    }
  | {
      type: "new_summary"
      timestamp: number
      summary: Extract<MemoryDetailRecord, { kind: "summary" }>
    }
  | ({
      type: "processing_status"
      timestamp: number
    } & MemoryWorkerStatusSnapshot)
