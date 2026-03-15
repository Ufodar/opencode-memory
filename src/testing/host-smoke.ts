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

type SmokeMode = "control" | "robust"

type SmokeOutputFiles = {
  run1: string
  run2?: string
  run3?: string
  run4?: string
  sqlite: string
  tempConfig: string
}

type SmokeResult = {
  mode: SmokeMode
  sessionId?: string
  passed: boolean
  failures: string[]
  writeChain: WriteChainEvaluation
  retrievalChain?: RetrievalChainEvaluation
  sqliteCounts: SqliteCounts
  outputFiles: SmokeOutputFiles
}

type SmokeRunReport = {
  workspace: string
  localPluginConfigPath: string
  results: SmokeResult[]
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

    if (line.startsWith("[opencode-memory]")) {
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
  const summaryLogSignals = parsed.pluginLogs.filter((entry) => entry.message.includes("captured summary")).length

  return {
    readCalls,
    observationCaptures,
    summaryLogSignals,
    passed: readCalls >= 1 && observationCaptures >= 1,
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
  mode: SmokeMode
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

export function renderSmokeSummary(report: SmokeRunReport) {
  const lines: string[] = []

  lines.push("# Host Smoke 测试摘要")
  lines.push("")
  lines.push(`- 工作区：${report.workspace}`)
  lines.push(`- 本地插件配置：${report.localPluginConfigPath}`)
  lines.push("")

  for (const result of report.results) {
    lines.push(`## ${describeMode(result.mode)}`)
    lines.push("")
    lines.push(`- 总结论：${result.passed ? "通过" : "失败"}`)
    lines.push(`- Session ID：${result.sessionId ?? "未拿到"}`)
    lines.push(`- 写入链：${describeWriteChain(result.writeChain)}`)
    lines.push(
      `- 数据库计数：request=${result.sqliteCounts.requestAnchors}, observation=${result.sqliteCounts.observations}, summary=${result.sqliteCounts.summaries}`,
    )

    if (result.mode === "control") {
      lines.push(`- 回查链：${describeRetrievalChain(result.retrievalChain)}`)
    } else {
      lines.push("- 回查链：本模式不做回查链强校验，只观察写入链是否成立")
    }

    if (result.failures.length > 0) {
      lines.push("- 失败原因：")
      for (const failure of result.failures) {
        lines.push(`  - ${describeFailure(failure)}`)
      }
    } else {
      lines.push("- 失败原因：无")
    }

    lines.push("- 证据文件：")
    lines.push(`  - run1: ${result.outputFiles.run1}`)
    if (result.outputFiles.run2) lines.push(`  - run2: ${result.outputFiles.run2}`)
    if (result.outputFiles.run3) lines.push(`  - run3: ${result.outputFiles.run3}`)
    if (result.outputFiles.run4) lines.push(`  - run4: ${result.outputFiles.run4}`)
    lines.push(`  - sqlite: ${result.outputFiles.sqlite}`)
    lines.push(`  - tempConfig: ${result.outputFiles.tempConfig}`)
    lines.push("")
  }

  return lines.join("\n").trim() + "\n"
}

function countCompletedToolUses(parsed: ParsedRunOutput, tool: string) {
  return parsed.jsonEvents.filter(
    (event) => event.type === "tool_use" && event.part?.tool === tool && event.part?.state?.status === "completed",
  ).length
}

function describeMode(mode: SmokeMode) {
  if (mode === "control") {
    return "控制变量测试"
  }

  return "更松的参考测试"
}

function describeWriteChain(result: WriteChainEvaluation) {
  return result.passed
    ? `通过（read=${result.readCalls}, observation=${result.observationCaptures}, summary日志=${result.summaryLogSignals}）`
    : `失败（read=${result.readCalls}, observation=${result.observationCaptures}, summary日志=${result.summaryLogSignals}）`
}

function describeRetrievalChain(result?: RetrievalChainEvaluation) {
  if (!result) {
    return "未执行"
  }

  return result.passed
    ? `通过（search=${result.searchCalls}, timeline=${result.timelineCalls}, details=${result.detailsCalls}）`
    : `失败（search=${result.searchCalls}, timeline=${result.timelineCalls}, details=${result.detailsCalls}）`
}

function describeFailure(failure: string) {
  const knownFailures: Record<string, string> = {
    "missing session id": "没有拿到 session id",
    "write chain failed": "写入链没有成立",
    "missing observations in sqlite": "SQLite 里没有 observation",
    "missing summaries in sqlite": "SQLite 里没有 summary",
    "retrieval chain failed": "回查链没有成立",
  }

  return knownFailures[failure] ?? failure
}

export type { ParsedRunOutput, SmokeRunReport, SmokeResult, SqliteCounts }
