import { createSessionReentryGuard } from "../runtime/hooks/idle-summary-guard.js"
import { generateModelSummary } from "../services/ai/model-summary.js"
import { log } from "../services/logger.js"
import { createMemoryWorkerService } from "../services/memory-worker-service.js"
import { SQLiteMemoryStore } from "../storage/sqlite/memory-store.js"
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
} from "./protocol.js"

export interface MemoryWorkerServerHandle {
  port: number
  baseUrl: string
  stop(): Promise<void>
}

export async function startMemoryWorkerServer(input: {
  port: number
  projectPath: string
  databasePath: string
}): Promise<MemoryWorkerServerHandle> {
  const store = new SQLiteMemoryStore(input.databasePath)
  const idleSummaryGuard = createSessionReentryGuard()
  const worker = createMemoryWorkerService({
    projectPath: input.projectPath,
    store,
    idleSummaryGuard,
    generateModelSummary,
  })

  const server = Bun.serve({
    port: input.port,
    idleTimeout: 30,
    fetch: async (request) => {
      const url = new URL(request.url)

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true })
      }

      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 })
      }

      try {
        switch (url.pathname) {
          case "/capture/request-anchor":
            return json(
              await worker.captureRequestAnchorFromMessage(
                await readJson<CaptureRequestAnchorRequest>(request),
              ) satisfies CaptureRequestAnchorResponse,
            )
          case "/capture/observation": {
            const payload = await readJson<CaptureObservationRequest>(request)
            return json(
              await worker.captureObservationFromToolCall(
                payload.toolInput,
                payload.output,
              ) satisfies CaptureObservationResponse,
            )
          }
          case "/session/idle":
            return json(
              await worker.handleSessionIdle(
                (await readJson<IdleSummaryRequest>(request)).sessionID,
              ) satisfies IdleSummaryResponse,
            )
          case "/injection/select":
            return json(
              await worker.selectInjectionRecords(
                await readJson<SelectInjectionRequest>(request),
              ) satisfies SelectInjectionResponse,
            )
          case "/injection/system-context":
            return json(
              await worker.buildSystemContext(
                await readJson<BuildSystemContextRequest>(request),
              ) satisfies BuildSystemContextResponse,
            )
          case "/injection/compaction-context":
            return json(
              await worker.buildCompactionContext(
                await readJson<BuildCompactionContextRequest>(request),
              ) satisfies BuildCompactionContextResponse,
            )
          case "/search":
            return json(
              await worker.searchMemoryRecords(
                await readJson<SearchMemoryRequest>(request),
              ) satisfies SearchMemoryResponse,
            )
          case "/timeline":
            return json(
              await worker.getMemoryTimeline(
                await readJson<TimelineMemoryRequest>(request),
              ) satisfies TimelineMemoryResponse,
            )
          case "/details":
            return json(
              await worker.getMemoryDetails(
                (await readJson<MemoryDetailsRequest>(request)).ids,
              ) satisfies MemoryDetailsResponse,
            )
          default:
            return json({ error: "Not found" }, { status: 404 })
        }
      } catch (error) {
        log("memory worker request failed", {
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        })
        return json(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    },
  })

  const port = server.port
  if (typeof port !== "number") {
    server.stop(true)
    store.close()
    throw new Error("Memory worker server did not expose a port")
  }

  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      server.stop(true)
      store.close()
    },
  }
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

function json(value: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
}
