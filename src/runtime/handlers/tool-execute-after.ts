import { log as defaultLog } from "../../services/logger.js"
import type { MemoryWorkerService } from "../../services/memory-worker-service.js"

type ToolAfterLogger = typeof defaultLog

export interface ToolExecuteAfterHandlerDependencies {
  worker: Pick<MemoryWorkerService, "captureObservationFromToolCall">
  log?: ToolAfterLogger
}

export function createToolExecuteAfterHandler(input: ToolExecuteAfterHandlerDependencies) {
  const log = input.log ?? defaultLog

  return async (
    toolInput: {
      tool: string
      sessionID: string
      callID: string
      args: unknown
    },
    output: {
      title: string
      output: string
      metadata: Record<string, unknown>
    },
  ) => {
    const observation = await input.worker.captureObservationFromToolCall(toolInput, output)

    if (!observation) {
      return
    }

    log("captured observation", { id: observation.id, tool: observation.tool.name })
  }
}
