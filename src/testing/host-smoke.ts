type JsonEvent = {
  sessionID?: string
  type?: string
  part?: {
    tool?: string
    state?: {
      status?: string
      output?: string
    }
  }
}

type ParsedPluginLog = {
  kind: "plugin-log"
  message: string
}

type ParsedRunOutput = {
  rawLines: string[]
  jsonEvents: JsonEvent[]
  pluginLogs: ParsedPluginLog[]
}

type MinimalHostConfigInput = {
  $schema?: string
  agent?: unknown
  provider?: Record<string, unknown>
}

type MinimalHostConfigOptions = {
  provider: string
  model: string
}

type WriteChainEvaluation = ReturnType<typeof evaluateWriteChain>
type RetrievalChainEvaluation = ReturnType<typeof evaluateRetrievalChain>
type SqliteCounts = {
  requestAnchors: number
  observations: number
  summaries: number
}

export function parseRunOutput(text: string): ParsedRunOutput {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const jsonEvents: JsonEvent[] = []
  const pluginLogs: ParsedPluginLog[] = []

  for (const line of rawLines) {
    if (line.startsWith("{")) {
      const parsed = JSON.parse(line) as JsonEvent
      jsonEvents.push(parsed)
      continue
    }

    if (line.startsWith("[opencode-continuity]")) {
      pluginLogs.push({
        kind: "plugin-log",
        message: line,
      })
    }
  }

  return {
    rawLines,
    jsonEvents,
    pluginLogs,
  }
}

export function extractSessionId(parsed: ParsedRunOutput): string | undefined {
  for (const event of parsed.jsonEvents) {
    if (event.sessionID) return event.sessionID
  }

  return undefined
}

export function evaluateWriteChain(parsed: ParsedRunOutput) {
  const readCalls = parsed.jsonEvents.filter(
    (event) => event.type === "tool_use" && event.part?.tool === "read" && event.part?.state?.status === "completed",
  ).length

  const observationCaptures = parsed.pluginLogs.filter((entry) => entry.message.includes("captured observation")).length
  const summaryCaptures = parsed.pluginLogs.filter((entry) => entry.message.includes("captured summary")).length

  return {
    readCalls,
    observationCaptures,
    summaryCaptures,
    passed: readCalls >= 1 && observationCaptures >= 1 && summaryCaptures >= 1,
  }
}

export function evaluateRetrievalChain(parsed: ParsedRunOutput) {
  const searchCalls = countCompletedToolUses(parsed, "memory_search")
  const timelineCalls = countCompletedToolUses(parsed, "memory_timeline")
  const detailsCalls = countCompletedToolUses(parsed, "memory_details")

  return {
    searchCalls,
    timelineCalls,
    detailsCalls,
    passed: searchCalls >= 1 && timelineCalls >= 1 && detailsCalls >= 1,
  }
}

export function extractFirstSearchResultId(parsed: ParsedRunOutput): string | undefined {
  for (const event of parsed.jsonEvents) {
    if (event.type !== "tool_use") continue
    if (event.part?.tool !== "memory_search") continue
    if (event.part?.state?.status !== "completed") continue
    if (!event.part?.state?.output) continue

    const parsedOutput = JSON.parse(event.part.state.output) as {
      results?: Array<{ id?: string }>
    }

    const firstId = parsedOutput.results?.[0]?.id
    if (firstId) return firstId
  }

  return undefined
}

export function buildMinimalHostConfig(config: MinimalHostConfigInput, options: MinimalHostConfigOptions) {
  const selectedProvider = config.provider?.[options.provider]

  if (!selectedProvider) {
    throw new Error(`Provider not found in config: ${options.provider}`)
  }

  return {
    $schema: config.$schema ?? "https://opencode.ai/config.json",
    ...(config.agent ? { agent: config.agent } : {}),
    provider: {
      [options.provider]: selectedProvider,
    },
    model: options.model,
  }
}

export function buildSmokeReport(input: {
  mode: "control" | "robust"
  sessionId?: string
  writeChain: WriteChainEvaluation
  retrievalChain?: RetrievalChainEvaluation
  sqliteCounts: SqliteCounts
}) {
  const failures: string[] = []

  if (!input.sessionId) {
    failures.push("missing session id")
  }

  if (!input.writeChain.passed) {
    failures.push("write chain failed")
  }

  if (input.sqliteCounts.observations < 1) {
    failures.push("missing observations in sqlite")
  }

  if (input.sqliteCounts.summaries < 1) {
    failures.push("missing summaries in sqlite")
  }

  if (input.mode === "control") {
    if (!input.retrievalChain?.passed) {
      failures.push("retrieval chain failed")
    }
  }

  return {
    mode: input.mode,
    sessionId: input.sessionId,
    passed: failures.length === 0,
    failures,
    writeChain: input.writeChain,
    retrievalChain: input.retrievalChain,
    sqliteCounts: input.sqliteCounts,
  }
}

function countCompletedToolUses(parsed: ParsedRunOutput, tool: string) {
  return parsed.jsonEvents.filter(
    (event) => event.type === "tool_use" && event.part?.tool === tool && event.part?.state?.status === "completed",
  ).length
}

export type { ParsedRunOutput, SqliteCounts }
