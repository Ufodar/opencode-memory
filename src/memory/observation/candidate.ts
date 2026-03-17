import type { ObservationCandidate } from "./types.js"
import { inferObservationPhaseFromToolCall } from "./phase.js"

const HIGH_VALUE_TOOLS = new Set([
  "read",
  "filesystem_read_text_file",
  "grep",
  "glob",
  "edit",
  "write",
  "patch",
  "task",
])

const LOW_VALUE_TOOLS = new Set([
  "ls",
  "pwd",
  "memory_search",
  "memory_timeline",
  "memory_details",
  "memory_context_preview",
  "memory_queue_status",
  "memory_queue_retry",
])

export function shouldCaptureToolObservation(input: {
  tool: string
  args: unknown
}, output: {
  title?: string
  output?: string
}): ObservationCandidate {
  if (LOW_VALUE_TOOLS.has(input.tool)) {
    return { capture: false, reason: "low-information tool" }
  }

  if (HIGH_VALUE_TOOLS.has(input.tool)) {
    return { capture: true, reason: "high-value tool category" }
  }

  const text = typeof output.output === "string" ? output.output.trim() : ""
  const inferredPhase = inferObservationPhaseFromToolCall({
    tool: input.tool,
    args: input.args,
    content: text || output.title || "",
    outputSummary: text,
  })

  if (input.tool === "bash" && inferredPhase !== "other" && text.length > 0) {
    return { capture: true, reason: `bash action classified as ${inferredPhase}` }
  }

  if (text.length >= 40) {
    return { capture: true, reason: "meaningful output length" }
  }

  return { capture: false, reason: "insufficient signal" }
}
