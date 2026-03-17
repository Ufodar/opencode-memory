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
    output: unknown,
  ) => {
    const observation = await input.worker.captureObservationFromToolCall(
      toolInput,
      normalizeToolOutput(output),
    )

    if (!observation) {
      return
    }

    log("captured observation", { id: observation.id, tool: observation.tool.name })
  }
}

function normalizeToolOutput(output: unknown): {
  title: string
  output: string
  metadata: Record<string, unknown>
} {
  if (isPlainObject(output) && typeof output.output === "string") {
    return {
      title: typeof output.title === "string" ? output.title : "",
      output: output.output,
      metadata: isPlainObject(output.metadata) ? output.metadata : {},
    }
  }

  if (isPlainObject(output) && Array.isArray(output.content)) {
    const text = output.content
      .filter(
        (item): item is { type: string; text: string } =>
          isPlainObject(item) &&
          typeof item.type === "string" &&
          item.type === "text" &&
          typeof item.text === "string",
      )
      .map((item) => item.text)
      .join("\n")

    return {
      title: "",
      output: text,
      metadata: {},
    }
  }

  return {
    title: "",
    output: typeof output === "string" ? output : "",
    metadata: {},
  }
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
