import type { ObservationRecord } from "../../memory/observation/types.js"
import { shouldCaptureToolObservation } from "../../memory/observation/candidate.js"

export function captureToolObservation(input: {
  tool: string
  sessionID: string
  callID: string
  args: unknown
  projectPath: string
}, output: {
  title: string
  output: string
  metadata: Record<string, unknown>
}): ObservationRecord | null {
  const candidate = shouldCaptureToolObservation(
    { tool: input.tool, args: input.args },
    { title: output.title, output: output.output },
  )

  if (!candidate.capture) return null

  return {
    id: `obs_${Date.now()}_${input.callID}`,
    content: `${input.tool}: ${output.title || "captured tool result"}`,
    sessionID: input.sessionID,
    projectPath: input.projectPath,
    createdAt: Date.now(),
    tool: {
      name: input.tool,
      callID: input.callID,
      title: output.title,
      status: "success",
    },
    input: {
      summary: truncate(JSON.stringify(input.args)),
    },
    output: {
      summary: truncate(output.output),
    },
    retrieval: {
      importance: 0.6,
      tags: [input.tool, "observation"],
    },
    trace: {},
  }
}

function truncate(value: string, max = 220): string {
  return value.length <= max ? value : `${value.slice(0, max)}...`
}
