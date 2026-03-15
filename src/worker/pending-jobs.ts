import type { MemoryQueueFailedJob, MemoryQueueProcessingJob } from "../memory/contracts.js"
import type {
  CaptureObservationRequest,
  CaptureRequestAnchorRequest,
  IdleSummaryRequest,
} from "./protocol.js"

export type PendingJobKind = "request-anchor" | "observation" | "session-idle"
export type PendingJobStatus = "pending" | "processing" | "failed"

export type PendingJobPayload =
  | CaptureRequestAnchorRequest
  | CaptureObservationRequest
  | IdleSummaryRequest

export type PendingJobPayloadMap = {
  "request-anchor": CaptureRequestAnchorRequest
  observation: CaptureObservationRequest
  "session-idle": IdleSummaryRequest
}

type PendingJobBase = {
  id: number
  sessionID: string
  status: PendingJobStatus
  attemptCount: number
  createdAt: number
  updatedAt: number
  lastError: string | null
}

export type PendingJobRecord = {
  [K in PendingJobKind]: PendingJobBase & {
    kind: K
    payload: PendingJobPayloadMap[K]
  }
}[PendingJobKind]

export type PendingJobEnqueueInput = {
  [K in PendingJobKind]: {
    sessionID: string
    kind: K
    payload: PendingJobPayloadMap[K]
  }
}[PendingJobKind]

export interface PendingJobStore {
  enqueue(input: PendingJobEnqueueInput): number
  claimNext(sessionID: string): PendingJobRecord | null
  complete(id: number): void
  recordFailure(id: number, error: string): "pending" | "failed"
  listSessionIDsWithPendingJobs(): string[]
  resetProcessingToPending(): number
  getQueueStats(): {
    pending: number
    processing: number
    failed: number
  }
  listProcessingJobs(limit: number): MemoryQueueProcessingJob[]
  listFailedJobs(limit: number): MemoryQueueFailedJob[]
  retryJob(id: number): boolean
}
