import type { MemoryDetailRecord, MemoryWorkerStatusSnapshot } from "../memory/contracts.js"
import type { ObservationRecord } from "../memory/observation/types.js"
import type { MemoryWorkerStreamEvent } from "./protocol.js"

type MemorySummaryStreamRecord = Extract<MemoryDetailRecord, { kind: "summary" }>

export interface MemoryWorkerStreamBroadcaster {
  createResponse(request: Request): Response
  broadcastProcessingStatus(snapshot: MemoryWorkerStatusSnapshot): void
  broadcastObservation(observation: ObservationRecord): void
  broadcastSummary(summary: MemorySummaryStreamRecord): void
  getClientCount(): number
  close(): void
}

export function createMemoryWorkerStreamBroadcaster(input: {
  getCurrentStatus: () => MemoryWorkerStatusSnapshot
}): MemoryWorkerStreamBroadcaster {
  const encoder = new TextEncoder()
  const clients = new Set<ReadableStreamDefaultController<Uint8Array>>()

  return {
    createResponse(request) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          clients.add(controller)
          writeEvent(controller, encoder, {
            type: "connected",
            timestamp: Date.now(),
          })
          writeEvent(controller, encoder, {
            type: "processing_status",
            timestamp: Date.now(),
            ...input.getCurrentStatus(),
          })

          request.signal.addEventListener(
            "abort",
            () => {
              clients.delete(controller)
              safeClose(controller)
            },
            { once: true },
          )
        },
        cancel() {
          // Bun may call cancel without an abort signal when the client disconnects.
        },
      })

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      })
    },

    broadcastProcessingStatus(snapshot) {
      const event: MemoryWorkerStreamEvent = {
        type: "processing_status",
        timestamp: Date.now(),
        ...snapshot,
      }

      for (const client of clients) {
        try {
          writeEvent(client, encoder, event)
        } catch {
          clients.delete(client)
          safeClose(client)
        }
      }
    },

    broadcastObservation(observation) {
      broadcastToClients(clients, encoder, {
        type: "new_observation",
        timestamp: Date.now(),
        observation,
      })
    },

    broadcastSummary(summary) {
      broadcastToClients(clients, encoder, {
        type: "new_summary",
        timestamp: Date.now(),
        summary,
      })
    },

    getClientCount() {
      return clients.size
    },

    close() {
      for (const client of clients) {
        safeClose(client)
      }
      clients.clear()
    },
  }
}

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: MemoryWorkerStreamEvent,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

function broadcastToClients(
  clients: Set<ReadableStreamDefaultController<Uint8Array>>,
  encoder: TextEncoder,
  event: MemoryWorkerStreamEvent,
) {
  for (const client of clients) {
    try {
      writeEvent(client, encoder, event)
    } catch {
      clients.delete(client)
      safeClose(client)
    }
  }
}

function safeClose(controller: ReadableStreamDefaultController<Uint8Array>) {
  try {
    controller.close()
  } catch {
    // Ignore close errors from already-closed streams.
  }
}
