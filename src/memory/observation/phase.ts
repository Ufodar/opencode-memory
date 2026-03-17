import type { ObservationRecord, ObservationPhase } from "./types.js"

const CHINESE_DECISION_SIGNAL_PATTERN =
  /(形成决策|明确决策|决策[:：]|决定[:：]?|下一步[:：]?|先[^，。；]{0,40}(?:[，,。；;]|$))/u

const ENGLISH_DECISION_SIGNAL_PATTERN =
  /\b(?:decision|next step|first step|plan)\s*[:\-]|\bdecided to\b/i

const BASH_VERIFICATION_PATTERN =
  /\b(pytest|jest|vitest|bun test|npm test|pnpm test|yarn test|cargo test|go test|ctest|eslint|biome|lint|typecheck|tsc(?:\s+--noEmit)?|check)\b/i

const BASH_RESEARCH_PATTERN =
  /\b(cat|sed|head|tail|grep|rg|find|ls|tree|pwd|git status|git diff|git log|wc)\b/i

const BASH_EXECUTION_PATTERN =
  /\b(mkdir|mv|cp|rm|touch|bun install|npm install|pnpm install|yarn install|git add|git commit|chmod|chown)\b/i

export function looksLikeDecisionSignal(value: string): boolean {
  return (
    CHINESE_DECISION_SIGNAL_PATTERN.test(value) ||
    ENGLISH_DECISION_SIGNAL_PATTERN.test(value)
  )
}

export function inferObservationPhaseFromToolCall(input: {
  tool: string
  args: unknown
  content: string
  outputSummary: string
}): ObservationPhase {
  const text = `${input.content}\n${input.outputSummary}`.toLowerCase()
  if (looksLikeDecisionSignal(text)) return "decision"

  switch (input.tool) {
    case "task":
      return "planning"
    case "read":
    case "filesystem_read_text_file":
    case "grep":
    case "glob":
      return "research"
    case "edit":
    case "write":
    case "patch":
      return "execution"
    case "test":
    case "lint":
    case "check":
      return "verification"
    case "bash":
      return classifyBashPhase(input.args)
    default:
      return "other"
  }
}

export function classifyObservationPhase(observation: Pick<
  ObservationRecord,
  "phase" | "tool" | "content" | "output" | "input"
>): ObservationPhase {
  if (observation.phase) return observation.phase

  return inferObservationPhaseFromToolCall({
    tool: observation.tool.name,
    args: tryParseJson(observation.input.summary),
    content: observation.content,
    outputSummary: observation.output.summary,
  })
}

function classifyBashPhase(args: unknown): ObservationPhase {
  const command = extractBashCommand(args)
  if (!command) return "other"

  if (BASH_VERIFICATION_PATTERN.test(command)) return "verification"
  if (BASH_RESEARCH_PATTERN.test(command)) return "research"
  if (BASH_EXECUTION_PATTERN.test(command)) return "execution"
  return "other"
}

function extractBashCommand(args: unknown): string {
  if (!args || typeof args !== "object") return ""
  const record = args as Record<string, unknown>
  const value = record.command ?? record.cmd
  return typeof value === "string" ? value : ""
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
