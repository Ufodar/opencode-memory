import type { ObservationRecord } from "../../memory/observation/types.js"
import { shouldCaptureToolObservation } from "../../memory/observation/candidate.js"
import { inferObservationPhaseFromToolCall } from "../../memory/observation/phase.js"
import { buildReadSemanticSummary } from "./read-content-summary.js"

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
    trace: buildObservationTrace(input.tool, input.args, output.output, input.projectPath),
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
  if (isReadLikeTool(input.tool)) {
    const filePath = readFilePathFromArgs(input.args) ?? readFilePathFromOutput(input.output)
    const semanticReadSummary = buildReadSemanticSummary({
      filePath,
      output: input.output,
    })
    const normalizedOutput = collapseWhitespace(input.output)

    if (semanticReadSummary) {
      return {
        content: semanticReadSummary,
        outputSummary: semanticReadSummary,
      }
    }

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

function extractTraceFilePaths(args: unknown, output: string): string[] | undefined {
  const paths = new Set<string>()

  const fromArgs = readFilePathFromArgs(args)
  if (fromArgs) {
    paths.add(fromArgs)
  }

  const fromOutput = readFilePathFromOutput(output)
  if (fromOutput) {
    paths.add(fromOutput)
  }

  return paths.size > 0 ? Array.from(paths) : undefined
}

function buildObservationTrace(
  tool: string,
  args: unknown,
  output: string,
  projectPath: string,
): ObservationRecord["trace"] {
  const filePaths = extractTraceFilePaths(args, output)
  const filesRead = classifyFilesRead(tool, filePaths)
  const filesModified = classifyFilesModified(tool, filePaths)
  const command = readCommandFromArgs(args)

  return compactTrace({
    workingDirectory: projectPath,
    filePaths,
    filesRead,
    filesModified,
    command,
  })
}

function classifyFilesRead(
  tool: string,
  filePaths: string[] | undefined,
): string[] | undefined {
  if (!filePaths || filePaths.length === 0) return undefined
  if (!READ_OR_DISCOVERY_TOOLS.has(tool)) return undefined
  return filePaths
}

function classifyFilesModified(
  tool: string,
  filePaths: string[] | undefined,
): string[] | undefined {
  if (!filePaths || filePaths.length === 0) return undefined
  if (!WRITE_OR_MODIFY_TOOLS.has(tool)) return undefined
  return filePaths
}

function readCommandFromArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined
  const record = args as Record<string, unknown>
  const value = record.command
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function compactTrace(trace: ObservationRecord["trace"]): ObservationRecord["trace"] {
  return Object.fromEntries(
    Object.entries(trace).filter(([, value]) => value !== undefined),
  ) as ObservationRecord["trace"]
}

const READ_OR_DISCOVERY_TOOLS = new Set(["read", "filesystem_read_text_file", "grep", "glob"])
const WRITE_OR_MODIFY_TOOLS = new Set(["write", "edit", "patch"])

function isReadLikeTool(tool: string): boolean {
  return tool === "read" || tool === "filesystem_read_text_file"
}
