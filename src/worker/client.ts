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
  SessionCompleteRequest,
  SessionCompleteResponse,
  MemoryWorkerSnapshotRequest,
  MemoryWorkerSnapshotResponse,
  QueueRetryRequest,
  QueueRetryResponse,
  QueueStatusRequest,
  QueueStatusResponse,
  SearchMemoryRequest,
  SearchMemoryResponse,
  SelectInjectionRequest,
  SelectInjectionResponse,
  TimelineMemoryRequest,
  TimelineMemoryResponse,
  MemoryWorkerStreamEvent,
  WorkerAcceptedResponse,
  WorkerHealthResponse,
} from "./protocol.js"

type FetchLike = typeof fetch

const DEFAULT_WORKER_REQUEST_TIMEOUT_MS = 5_000
const DEFAULT_WORKER_HEALTH_TIMEOUT_MS = 1_000

export interface MemoryWorkerEventStream {
  readNext(timeoutMs?: number): Promise<MemoryWorkerStreamEvent>
  close(): Promise<void>
}

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
      return post<CaptureRequestAnchorRequest, WorkerAcceptedResponse>(
        fetchImpl,
        `${baseUrl}/enqueue/request-anchor`,
        payload,
        requestTimeoutMs,
      ).then(() => null satisfies CaptureRequestAnchorResponse)
    },

    captureObservationFromToolCall(toolInput, output) {
      return post<CaptureObservationRequest, WorkerAcceptedResponse>(
        fetchImpl,
        `${baseUrl}/enqueue/observation`,
        { toolInput, output },
        requestTimeoutMs,
      ).then(() => null satisfies CaptureObservationResponse)
    },

    handleSessionIdle(sessionID) {
      return post<IdleSummaryRequest, IdleSummaryResponse>(
        fetchImpl,
        `${baseUrl}/enqueue/session-idle`,
        { sessionID },
        requestTimeoutMs,
      )
    },

    completeSession(sessionID) {
      return post<SessionCompleteRequest, SessionCompleteResponse>(
        fetchImpl,
        `${baseUrl}/session/complete`,
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

    getQueueStatus(payload) {
      return post<QueueStatusRequest, QueueStatusResponse>(
        fetchImpl,
        `${baseUrl}/queue/status`,
        payload,
        requestTimeoutMs,
      )
    },

    getLiveSnapshot(payload) {
      return post<MemoryWorkerSnapshotRequest, MemoryWorkerSnapshotResponse>(
        fetchImpl,
        `${baseUrl}/stream/snapshot`,
        payload,
        requestTimeoutMs,
      )
    },

    retryQueueJob(jobID) {
      return post<QueueRetryRequest, QueueRetryResponse>(
        fetchImpl,
        `${baseUrl}/queue/retry`,
        { jobID },
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

export async function openMemoryWorkerEventStream(input: {
  baseUrl: string
  fetchImpl?: FetchLike
  requestTimeoutMs?: number
}): Promise<MemoryWorkerEventStream> {
  const fetchImpl = input.fetchImpl ?? fetch
  const requestTimeoutMs = input.requestTimeoutMs ?? DEFAULT_WORKER_REQUEST_TIMEOUT_MS
  const normalizedBaseUrl = input.baseUrl.replace(/\/$/, "")
  const response = await withRequestTimeout(
    (signal) => fetchImpl(`${normalizedBaseUrl}/stream`, { signal }),
    requestTimeoutMs,
    "Memory worker stream open",
  )

  if (!response.ok) {
    const message = await safeReadError(response)
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error("Memory worker stream has no response body")
  }

  const reader = response.body.getReader()
  let buffer = ""

  return {
    async readNext(timeoutMs = requestTimeoutMs) {
      const deadline = Date.now() + timeoutMs

      while (Date.now() < deadline) {
        const frame = tryReadSseFrame()
        if (frame) {
          return JSON.parse(frame) as MemoryWorkerStreamEvent
        }

        const remainingMs = deadline - Date.now()
        const result = await Promise.race([
          reader.read(),
          sleep(Math.max(1, remainingMs)).then(() => "timeout" as const),
        ])

        if (result === "timeout") {
          break
        }

        if (result.done) {
          break
        }

        buffer += new TextDecoder().decode(result.value)
      }

      throw new Error(`Memory worker stream timed out after ${timeoutMs}ms`)
    },

    async close() {
      await reader.cancel()
    },
  }

  function tryReadSseFrame(): string | null {
    const separatorIndex = buffer.indexOf("\n\n")
    if (separatorIndex === -1) {
      return null
    }

    const frame = buffer.slice(0, separatorIndex)
    buffer = buffer.slice(separatorIndex + 2)

    const dataLines = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim())

    if (dataLines.length === 0) {
      return null
    }

    return dataLines.join("\n")
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
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort(timeoutError)
      reject(timeoutError)
    }, timeoutMs)

    controller.signal.addEventListener(
      "abort",
      () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }
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
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
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
