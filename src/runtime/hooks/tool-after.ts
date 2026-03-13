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

  const content = buildObservationContent(input.tool, output.title, output.output)

  return {
    id: `obs_${Date.now()}_${input.callID}`,
    content,
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

function buildObservationContent(tool: string, title: string, output: string): string {
  const normalizedOutput = collapseWhitespace(output)
  if (normalizedOutput) {
    return truncate(normalizedOutput, 220)
  }

  return `${tool}: ${title || "captured tool result"}`
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}
