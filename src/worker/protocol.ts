import type { MemoryDetailRecord, MemorySearchRecord, MemoryTimelineResult } from "../memory/contracts.js"
import type { ObservationRecord } from "../memory/observation/types.js"
import type { RequestAnchorRecord } from "../memory/request/types.js"
import type { SummaryRecord } from "../memory/summary/types.js"

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

export type IdleSummaryResponse =
  | { status: "busy" }
  | { status: "missing-request" }
  | { status: "no-op"; requestAnchorID?: string }
  | {
      status: "summarized"
      requestAnchorID: string
      summaryID: string
      checkpointObservationAt: number
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

export interface WorkerHealthResponse {
  ok: true
  version: string
}
