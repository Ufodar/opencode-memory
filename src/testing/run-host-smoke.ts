import { Database } from "bun:sqlite"
import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildMinimalHostConfig,
  buildSmokeReport,
  evaluateRetrievalChain,
  evaluateWriteChain,
  extractFirstSearchResultId,
  extractSessionId,
  parseRunOutput,
  renderSmokeSummary,
  type SqliteCounts,
} from "./host-smoke.js"

type Mode = "control" | "robust" | "both"

type SmokeOptions = {
  workspace: string
  mode: Mode
  provider: string
  model: string
  globalConfigPath: string
  opencodeBin: string
}

const DEFAULT_PROVIDER = "my-company"
const DEFAULT_MODEL = "Kimi-K2.5"
const DEFAULT_GLOBAL_CONFIG = path.join(os.homedir(), ".config", "opencode", "opencode.json")
const DEFAULT_OPCODE_BIN = "opencode"

const CONTROL_PROMPT = (workspace: string) =>
  `只读取这两个绝对路径，且不要改写路径：${path.join(workspace, "brief.txt")} 和 ${path.join(
    workspace,
    "checklist.md",
  )}。先读取，再必须调用 write 工具把一句话总结写入这个绝对路径：${path.join(
    workspace,
    "smoke-summary.txt",
  )}。不要调用任何 memory 工具，不要读取任何其他路径。`

const ROBUST_PROMPT = "读取 brief.txt 和 checklist.md，然后用一句话说明这两个文件各自是什么。不要调用任何 memory 工具。"

const SEARCH_PROMPT = "只做 memory 回查，不要读取任何文件。只调用 memory_search 查询 brief。"
const TIMELINE_PROMPT = (id: string) =>
  `只做 memory 回查，不要读取任何文件。只调用 memory_timeline，anchor 使用这个 id：${id}。`
const DETAILS_PROMPT = (id: string) =>
  `只做 memory 回查，不要读取任何文件。只调用 memory_details，ids 只包含这个 id：${id}。`

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await ensureFixtureWorkspace(options.workspace)

  const pluginEntry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist/index.js")
  await assertFile(pluginEntry, "dist plugin entry")

  const globalConfig = JSON.parse(await readFile(options.globalConfigPath, "utf8"))
  const minimalHostConfig = buildMinimalHostConfig(globalConfig, {
    provider: options.provider,
    model: options.model,
  })

  const localPluginConfigPath = await ensureLocalPluginConfig(options.workspace, pluginEntry)

  const results =
    options.mode === "both"
      ? [
          await runMode("control", options, minimalHostConfig),
          await runMode("robust", options, minimalHostConfig),
        ]
      : [await runMode(options.mode, options, minimalHostConfig)]

  const output = {
    workspace: options.workspace,
    localPluginConfigPath,
    results,
  }

  const reportStamp = `host-smoke-${Date.now()}`
  const jsonReportPath = path.join(options.workspace, `${reportStamp}-report.json`)
  const markdownReportPath = path.join(options.workspace, `${reportStamp}-report.md`)

  await writeFile(jsonReportPath, JSON.stringify(output, null, 2) + "\n")
  await writeFile(markdownReportPath, renderSmokeSummary(output))

  console.log(
    JSON.stringify(
      {
        ...output,
        reportFiles: {
          json: jsonReportPath,
          markdown: markdownReportPath,
        },
      },
      null,
      2,
    ),
  )

  if (results.some((result) => result.mode === "control" && !result.passed)) {
    process.exitCode = 1
  }
}

async function runMode(mode: "control" | "robust", options: SmokeOptions, minimalHostConfig: unknown) {
  const stamp = `${mode}-${Date.now()}`
  const tempHome = path.join(options.workspace, `.tmp-home-${stamp}`)
  const tempConfigPath = path.join(options.workspace, `.tmp-opencode-${stamp}.json`)
  const run1Path = path.join(options.workspace, `${stamp}-run1.jsonl`)
  const retrievalSearchPath = path.join(options.workspace, `${stamp}-run2-search.jsonl`)
  const retrievalTimelinePath = path.join(options.workspace, `${stamp}-run3-timeline.jsonl`)
  const retrievalDetailsPath = path.join(options.workspace, `${stamp}-run4-details.jsonl`)
  const dbPath = path.join(tempHome, ".opencode-memory", "data", "memory.sqlite")

  await mkdir(tempHome, { recursive: true })
  await writeFile(tempConfigPath, JSON.stringify(minimalHostConfig, null, 2) + "\n")

  await runOpencode({
    bin: options.opencodeBin,
    cwd: options.workspace,
    env: {
      HOME: tempHome,
      OPENCODE_CONFIG: tempConfigPath,
    },
    args: [
      "run",
      "--dir",
      options.workspace,
      "--model",
      `${options.provider}/${options.model}`,
      "--format",
      "json",
      mode === "control" ? CONTROL_PROMPT(options.workspace) : ROBUST_PROMPT,
    ],
    outputPath: run1Path,
  })

  const parsedWrite = parseRunOutput(await readFile(run1Path, "utf8"))
  const sessionId = extractSessionId(parsedWrite)
  const writeChain = evaluateWriteChain(parsedWrite)

  let retrievalChain = undefined

  if (mode === "control" && sessionId) {
    await runOpencode({
      bin: options.opencodeBin,
      cwd: options.workspace,
      env: {
        HOME: tempHome,
        OPENCODE_CONFIG: tempConfigPath,
      },
      args: [
        "run",
        "--dir",
        options.workspace,
        "--session",
        sessionId,
        "--model",
        `${options.provider}/${options.model}`,
        "--format",
        "json",
        SEARCH_PROMPT,
      ],
      outputPath: retrievalSearchPath,
    })

    const parsedSearch = parseRunOutput(await readFile(retrievalSearchPath, "utf8"))
    const anchorId = extractFirstSearchResultId(parsedSearch)

    if (anchorId) {
      await runOpencode({
        bin: options.opencodeBin,
        cwd: options.workspace,
        env: {
          HOME: tempHome,
          OPENCODE_CONFIG: tempConfigPath,
        },
        args: [
          "run",
          "--dir",
          options.workspace,
          "--session",
          sessionId,
          "--model",
          `${options.provider}/${options.model}`,
          "--format",
          "json",
          TIMELINE_PROMPT(anchorId),
        ],
        outputPath: retrievalTimelinePath,
      })

      await runOpencode({
        bin: options.opencodeBin,
        cwd: options.workspace,
        env: {
          HOME: tempHome,
          OPENCODE_CONFIG: tempConfigPath,
        },
        args: [
          "run",
          "--dir",
          options.workspace,
          "--session",
          sessionId,
          "--model",
          `${options.provider}/${options.model}`,
          "--format",
          "json",
          DETAILS_PROMPT(anchorId),
        ],
        outputPath: retrievalDetailsPath,
      })
    }

    const combinedRetrievalOutput = [
      await readFile(retrievalSearchPath, "utf8"),
      anchorId ? await readFile(retrievalTimelinePath, "utf8") : "",
      anchorId ? await readFile(retrievalDetailsPath, "utf8") : "",
    ]
      .filter(Boolean)
      .join("\n")

    retrievalChain = evaluateRetrievalChain(parseRunOutput(combinedRetrievalOutput))
  }

  const sqliteCounts = readSqliteCounts(dbPath)

  const report = buildSmokeReport({
    mode,
    sessionId,
    writeChain,
    retrievalChain,
    sqliteCounts,
  })

  return {
    ...report,
    outputFiles: {
      run1: run1Path,
      run2: mode === "control" ? retrievalSearchPath : undefined,
      run3: mode === "control" ? retrievalTimelinePath : undefined,
      run4: mode === "control" ? retrievalDetailsPath : undefined,
      sqlite: dbPath,
      tempConfig: tempConfigPath,
    },
  }
}

async function runOpencode(input: {
  bin: string
  cwd: string
  env: Record<string, string>
  args: string[]
  outputPath: string
}) {
  const proc = Bun.spawn([input.bin, ...input.args], {
    cwd: input.cwd,
    env: {
      ...process.env,
      ...input.env,
    },
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  const exitCode = await proc.exited

  await writeFile(input.outputPath, stdout)

  if (exitCode !== 0) {
    throw new Error(`opencode run failed (${exitCode})\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`)
  }
}

async function ensureFixtureWorkspace(workspace: string) {
  await mkdir(path.join(workspace, ".opencode"), { recursive: true })
  await writeFile(
    path.join(workspace, "brief.txt"),
    [
      "这是一个真实 OpenCode 宿主 smoke 测试文件。",
      "",
      "目标：",
      "1. 让 agent 使用 read 工具读取这个文件。",
      "2. 让 opencode-memory 通过 tool.execute.after 写入 observation。",
      "3. 在后续请求中通过 memory_search / memory_timeline / memory_details 找回这段连续性数据。",
    ].join("\n") + "\n",
  )
  await writeFile(
    path.join(workspace, "checklist.md"),
    [
      "# Smoke Checklist",
      "",
      "- [ ] 插件在真实 OpenCode 宿主中加载",
      "- [ ] `read` 工具被调用",
      "- [ ] memory 数据库创建成功",
      "- [ ] observation 被写入",
      "- [ ] summary 被写入",
      "- [ ] `memory_search` 可找回该工作轨迹",
      "- [ ] `memory_timeline` 可展示时间线",
      "- [ ] `memory_details` 可下钻详情",
    ].join("\n") + "\n",
  )
}

async function ensureLocalPluginConfig(workspace: string, pluginEntry: string) {
  const configPath = path.join(workspace, ".opencode", "opencode.json")
  await mkdir(path.dirname(configPath), { recursive: true })
  await writeFile(
    configPath,
    JSON.stringify(
      {
        $schema: "https://opencode.ai/config.json",
        plugin: [`file://${pluginEntry}`],
      },
      null,
      2,
    ) + "\n",
  )
  return configPath
}

function readSqliteCounts(dbPath: string): SqliteCounts {
  const db = new Database(dbPath, { readonly: true })

  try {
    return {
      requestAnchors: count(db, "request_anchors"),
      observations: count(db, "observations"),
      summaries: count(db, "summaries"),
    }
  } finally {
    db.close()
  }
}

function count(db: Database, table: string) {
  const row = db.query(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count?: number } | null
  return Number(row?.count ?? 0)
}

async function assertFile(filepath: string, label: string) {
  try {
    await stat(filepath)
  } catch {
    throw new Error(`Missing ${label}: ${filepath}`)
  }
}

function parseArgs(argv: string[]): SmokeOptions {
  const values = new Map<string, string>()

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i]
    if (!current.startsWith("--")) continue
    const key = current.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith("--")) {
      values.set(key, "true")
      continue
    }
    values.set(key, value)
    i += 1
  }

  const workspace = values.get("workspace")
  if (!workspace) {
    throw new Error("--workspace is required")
  }

  const modeValue = values.get("mode") ?? "control"
  if (modeValue !== "control" && modeValue !== "robust" && modeValue !== "both") {
    throw new Error(`Unsupported mode: ${modeValue}`)
  }

  return {
    workspace: path.resolve(workspace),
    mode: modeValue,
    provider: values.get("provider") ?? DEFAULT_PROVIDER,
    model: values.get("model") ?? DEFAULT_MODEL,
    globalConfigPath: path.resolve(values.get("global-config") ?? DEFAULT_GLOBAL_CONFIG),
    opencodeBin: values.get("opencode-bin") ?? DEFAULT_OPCODE_BIN,
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
