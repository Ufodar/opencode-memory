import type { ObservationRecord } from "../../memory/observation/types.js"
import { captureToolObservation as defaultCaptureToolObservation } from "../hooks/tool-after.js"
import { log as defaultLog } from "../../services/logger.js"

type CaptureToolObservation = typeof defaultCaptureToolObservation
type ToolAfterLogger = typeof defaultLog

export interface ToolExecuteAfterHandlerDependencies {
  projectPath: string
  saveObservation(record: ObservationRecord): void
  captureToolObservation?: CaptureToolObservation
  log?: ToolAfterLogger
}

export function createToolExecuteAfterHandler(input: ToolExecuteAfterHandlerDependencies) {
  const captureToolObservation = input.captureToolObservation ?? defaultCaptureToolObservation
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
    const observation = captureToolObservation(
      {
        ...toolInput,
        projectPath: input.projectPath,
      },
      output,
    )

    if (!observation) {
      return
    }

    input.saveObservation(observation)
    log("captured observation", { id: observation.id, tool: observation.tool.name })
  }
}
