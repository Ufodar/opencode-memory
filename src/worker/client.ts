import type { MemoryWorkerService } from "../services/memory-worker-service.js"
import type {
  BuildCompactionContextRequest,
  BuildCompactionContextResponse,
  BuildSystemContextRequest,
  BuildSystemContextResponse,
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

const DEFAULT_WORKER_REQUEST_TIMEOUT_MS = 5_000
const DEFAULT_WORKER_HEALTH_TIMEOUT_MS = 1_000

export function createMemoryWorkerHttpClient(input: {
  baseUrl: string
  fetchImpl?: FetchLike
  requestTimeoutMs?: number
}): MemoryWorkerService {
  const fetchImpl = input.fetchImpl ?? fetch
  const baseUrl = input.baseUrl.replace(/\/$/, "")
  const requestTimeoutMs = input.requestTimeoutMs ?? DEFAULT_WORKER_REQUEST_TIMEOUT_MS

  return {
    captureRequestAnchorFromMessage(payload) {
      return post<CaptureRequestAnchorRequest, CaptureRequestAnchorResponse>(
        fetchImpl,
        `${baseUrl}/capture/request-anchor`,
        payload,
        requestTimeoutMs,
      )
    },

    captureObservationFromToolCall(toolInput, output) {
      return post<CaptureObservationRequest, CaptureObservationResponse>(
        fetchImpl,
        `${baseUrl}/capture/observation`,
        { toolInput, output },
        requestTimeoutMs,
      )
    },

    handleSessionIdle(sessionID) {
      return post<IdleSummaryRequest, IdleSummaryResponse>(
        fetchImpl,
        `${baseUrl}/session/idle`,
        { sessionID },
        requestTimeoutMs,
      )
    },

    selectInjectionRecords(payload) {
      return post<SelectInjectionRequest, SelectInjectionResponse>(
        fetchImpl,
        `${baseUrl}/injection/select`,
        payload,
        requestTimeoutMs,
      )
    },

    buildSystemContext(payload) {
      return post<BuildSystemContextRequest, BuildSystemContextResponse>(
        fetchImpl,
        `${baseUrl}/injection/system-context`,
        payload,
        requestTimeoutMs,
      )
    },

    buildCompactionContext(payload) {
      return post<BuildCompactionContextRequest, BuildCompactionContextResponse>(
        fetchImpl,
        `${baseUrl}/injection/compaction-context`,
        payload,
        requestTimeoutMs,
      )
    },

    searchMemoryRecords(payload) {
      return post<SearchMemoryRequest, SearchMemoryResponse>(
        fetchImpl,
        `${baseUrl}/search`,
        payload,
        requestTimeoutMs,
      )
    },

    getMemoryTimeline(payload) {
      return post<TimelineMemoryRequest, TimelineMemoryResponse>(
        fetchImpl,
        `${baseUrl}/timeline`,
        payload,
        requestTimeoutMs,
      )
    },

    getMemoryDetails(ids) {
      return post<MemoryDetailsRequest, MemoryDetailsResponse>(
        fetchImpl,
        `${baseUrl}/details`,
        { ids },
        requestTimeoutMs,
      )
    },
  }
}

export async function checkMemoryWorkerHealth(input: {
  baseUrl: string
  fetchImpl?: FetchLike
  requestTimeoutMs?: number
}): Promise<boolean> {
  const payload = await getMemoryWorkerHealth(input)
  return payload?.ok === true
}

export async function getMemoryWorkerHealth(input: {
  baseUrl: string
  fetchImpl?: FetchLike
  requestTimeoutMs?: number
}): Promise<WorkerHealthResponse | undefined> {
  const fetchImpl = input.fetchImpl ?? fetch
  const requestTimeoutMs = input.requestTimeoutMs ?? DEFAULT_WORKER_HEALTH_TIMEOUT_MS

  try {
    const response = await withRequestTimeout(
      (signal) => fetchImpl(`${input.baseUrl.replace(/\/$/, "")}/health`, { signal }),
      requestTimeoutMs,
      "Memory worker health check",
    )
    if (!response.ok) {
      return undefined
    }

    const payload = (await response.json()) as WorkerHealthResponse
    return payload
  } catch {
    return undefined
  }
}

export async function shutdownMemoryWorker(input: {
  baseUrl: string
  fetchImpl?: FetchLike
  requestTimeoutMs?: number
}): Promise<void> {
  const fetchImpl = input.fetchImpl ?? fetch
  const requestTimeoutMs = input.requestTimeoutMs ?? DEFAULT_WORKER_REQUEST_TIMEOUT_MS
  const normalizedBaseUrl = input.baseUrl.replace(/\/$/, "")

  const response = await withRequestTimeout(
    (signal) =>
      fetchImpl(`${normalizedBaseUrl}/shutdown`, {
        method: "POST",
        signal,
      }),
    requestTimeoutMs,
    "Memory worker shutdown",
  )

  if (!response.ok) {
    const message = await safeReadError(response)
    throw new Error(message)
  }

  const deadline = Date.now() + requestTimeoutMs

  while (Date.now() < deadline) {
    const healthy = await checkMemoryWorkerHealth({
      baseUrl: normalizedBaseUrl,
      fetchImpl,
      requestTimeoutMs: Math.min(250, requestTimeoutMs),
    })

    if (!healthy) {
      return
    }

    await sleep(25)
  }
}

async function post<TRequest, TResponse>(
  fetchImpl: FetchLike,
  url: string,
  payload: TRequest,
  timeoutMs: number,
): Promise<TResponse> {
  const response = await withRequestTimeout(
    (signal) =>
      fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      }),
    timeoutMs,
    "Memory worker request",
  )

  if (!response.ok) {
    const message = await safeReadError(response)
    throw new Error(message)
  }

  return (await response.json()) as TResponse
}

async function withRequestTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const controller = new AbortController()
  const timeoutError = new Error(`${label} timed out after ${timeoutMs}ms`)
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      controller.abort(timeoutError)
      reject(timeoutError)
    }, timeoutMs)

    controller.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
      },
      { once: true },
    )
  })

  try {
    return await Promise.race([run(controller.signal), timeoutPromise])
  } catch (error) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason
      if (reason instanceof Error) {
        throw reason
      }
      throw new Error(`${label} timed out after ${timeoutMs}ms`)
    }

    throw error
  }
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
