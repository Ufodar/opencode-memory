import type { MemoryWorkerService } from "../services/memory-worker-service.js"
import type {
  CaptureObservationRequest,
  CaptureObservationResponse,
  CaptureRequestAnchorRequest,
  CaptureRequestAnchorResponse,
  IdleSummaryRequest,
  IdleSummaryResponse,
  MemoryDetailsRequest,
  MemoryDetailsResponse,
  SearchMemoryRequest,
  SearchMemoryResponse,
  SelectInjectionRequest,
  SelectInjectionResponse,
  TimelineMemoryRequest,
  TimelineMemoryResponse,
  WorkerHealthResponse,
} from "./protocol.js"

type FetchLike = typeof fetch

export function createMemoryWorkerHttpClient(input: {
  baseUrl: string
  fetchImpl?: FetchLike
}): MemoryWorkerService {
  const fetchImpl = input.fetchImpl ?? fetch
  const baseUrl = input.baseUrl.replace(/\/$/, "")

  return {
    captureRequestAnchorFromMessage(payload) {
      return post<CaptureRequestAnchorRequest, CaptureRequestAnchorResponse>(
        fetchImpl,
        `${baseUrl}/capture/request-anchor`,
        payload,
      )
    },

    captureObservationFromToolCall(toolInput, output) {
      return post<CaptureObservationRequest, CaptureObservationResponse>(
        fetchImpl,
        `${baseUrl}/capture/observation`,
        { toolInput, output },
      )
    },

    handleSessionIdle(sessionID) {
      return post<IdleSummaryRequest, IdleSummaryResponse>(
        fetchImpl,
        `${baseUrl}/session/idle`,
        { sessionID },
      )
    },

    selectInjectionRecords(payload) {
      return post<SelectInjectionRequest, SelectInjectionResponse>(
        fetchImpl,
        `${baseUrl}/injection/select`,
        payload,
      )
    },

    searchMemoryRecords(payload) {
      return post<SearchMemoryRequest, SearchMemoryResponse>(
        fetchImpl,
        `${baseUrl}/search`,
        payload,
      )
    },

    getMemoryTimeline(payload) {
      return post<TimelineMemoryRequest, TimelineMemoryResponse>(
        fetchImpl,
        `${baseUrl}/timeline`,
        payload,
      )
    },

    getMemoryDetails(ids) {
      return post<MemoryDetailsRequest, MemoryDetailsResponse>(
        fetchImpl,
        `${baseUrl}/details`,
        { ids },
      )
    },
  }
}

export async function checkMemoryWorkerHealth(input: {
  baseUrl: string
  fetchImpl?: FetchLike
}): Promise<boolean> {
  const fetchImpl = input.fetchImpl ?? fetch

  try {
    const response = await fetchImpl(`${input.baseUrl.replace(/\/$/, "")}/health`)
    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as WorkerHealthResponse
    return payload.ok === true
  } catch {
    return false
  }
}

async function post<TRequest, TResponse>(
  fetchImpl: FetchLike,
  url: string,
  payload: TRequest,
): Promise<TResponse> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw new Error(message)
  }

  return (await response.json()) as TResponse
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (payload.error) {
      return payload.error
    }
  } catch {
    // ignore
  }

  return `Worker request failed with status ${response.status}`
}
