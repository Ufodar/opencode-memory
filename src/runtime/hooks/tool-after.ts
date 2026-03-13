import type { ObservationRecord } from "../../memory/observation/types.js"
import { shouldCaptureToolObservation } from "../../memory/observation/candidate.js"
import { inferObservationPhaseFromToolCall } from "../../memory/observation/phase.js"

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

  const summaries = buildObservationSummaries({
    tool: input.tool,
    args: input.args,
    title: output.title,
    output: output.output,
  })

  return {
    id: `obs_${Date.now()}_${input.callID}`,
    content: summaries.content,
    sessionID: input.sessionID,
    projectPath: input.projectPath,
    createdAt: Date.now(),
    phase: inferObservationPhaseFromToolCall({
      tool: input.tool,
      args: input.args,
      content: summaries.content,
      outputSummary: summaries.outputSummary,
    }),
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
      summary: summaries.outputSummary,
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

function buildObservationSummaries(input: {
  tool: string
  args: unknown
  title: string
  output: string
}): {
  content: string
  outputSummary: string
} {
  if (input.tool === "read") {
    const filePath = readFilePathFromArgs(input.args) ?? readFilePathFromOutput(input.output)
    const normalizedOutput = collapseWhitespace(input.output)

    if (normalizedOutput && !looksLikeRawReadPayload(input.output)) {
      const semantic = truncate(normalizedOutput, 220)
      return {
        content: semantic,
        outputSummary: semantic,
      }
    }

    if (input.title.trim()) {
      const titled = `read: ${input.title.trim()}`
      return {
        content: titled,
        outputSummary: titled,
      }
    }

    const label = filePath ? summarizePath(filePath) : "captured file"
    const value = `read: ${label}`
    return {
      content: value,
      outputSummary: value,
    }
  }

  const content = buildObservationContent(input.tool, input.title, input.output)
  return {
    content,
    outputSummary: truncate(collapseWhitespace(input.output), 220),
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function readFilePathFromArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined
  const record = args as Record<string, unknown>
  const value = record.filePath ?? record.file ?? record.path
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function readFilePathFromOutput(output: string): string | undefined {
  const match = output.match(/<path>(.*?)<\/path>/u)
  return match?.[1]?.trim() || undefined
}

function summarizePath(value: string): string {
  const normalized = value.trim()
  const segments = normalized.split("/").filter(Boolean)
  if (segments.length === 0) return normalized
  if (segments.length === 1) return segments[0]!
  return segments.slice(-2).join("/")
}

function looksLikeRawReadPayload(output: string): boolean {
  return /<path>.*<\/path>/us.test(output) || /<content>.*<\/content>/us.test(output)
}
