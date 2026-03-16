import type { ObservationRecord } from "../../memory/observation/types.js"
import { log } from "../logger.js"

export interface ModelObservationConfig {
  apiUrl: string
  apiKey: string
  model: string
}

export interface ModelObservationResult {
  content: string
  outputSummary?: string
  tags?: string[]
  importance?: number
}

export function getModelObservationConfig(
  env: NodeJS.ProcessEnv = process.env,
): ModelObservationConfig | null {
  const apiUrl = env.OPENCODE_MEMORY_OBSERVATION_API_URL?.trim()
  const apiKey = env.OPENCODE_MEMORY_OBSERVATION_API_KEY?.trim()
  const model = env.OPENCODE_MEMORY_OBSERVATION_MODEL?.trim()

  if (!apiUrl || !apiKey || !model) {
    return null
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    apiKey,
    model,
  }
}

export async function generateModelObservation(
  input: {
    toolInput: {
      tool: string
      sessionID: string
      callID: string
      args: unknown
    }
    output: {
      title: string
      output: string
      metadata: Record<string, unknown>
    }
    observation: ObservationRecord
  },
  deps: {
    env?: NodeJS.ProcessEnv
    fetchImpl?: typeof fetch
    timeoutMs?: number
  } = {},
): Promise<ModelObservationResult | null> {
  const config = getModelObservationConfig(deps.env ?? process.env)
  if (!config) return null

  const fetchImpl = deps.fetchImpl ?? fetch
  const timeoutMs = deps.timeoutMs ?? 2500

  try {
    const controller = new AbortController()
    const response = await withTimeout(
      fetchImpl(`${config.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          messages: buildMessages(input),
          temperature: 0.2,
          response_format: {
            type: "json_object",
          },
        }),
      }),
      timeoutMs,
      () => controller.abort(),
    )

    if (!response.ok) {
      log("model observation request failed", {
        status: response.status,
        statusText: response.statusText,
      })
      return null
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }
    const content = payload.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = safeParseJson(content)
    if (!parsed || typeof parsed.content !== "string" || !parsed.content.trim()) {
      return null
    }

    const normalizedContent = normalizeText(parsed.content, 200)
    if (!normalizedContent) return null

    const outputSummary =
      typeof parsed.outputSummary === "string"
        ? normalizeText(parsed.outputSummary, 160)
        : undefined

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .map((item) => normalizeTag(item))
          .filter((item): item is string => Boolean(item))
          .slice(0, 6)
      : undefined

    const importance =
      typeof parsed.importance === "number" && Number.isFinite(parsed.importance)
        ? Math.max(0, Math.min(1, parsed.importance))
        : undefined

    return {
      content: normalizedContent,
      outputSummary,
      tags: tags && tags.length > 0 ? tags : undefined,
      importance,
    }
  } catch (error) {
    log("model observation generation failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function buildMessages(input: {
  toolInput: {
    tool: string
    sessionID: string
    callID: string
    args: unknown
  }
  output: {
    title: string
    output: string
    metadata: Record<string, unknown>
  }
  observation: ObservationRecord
}) {
  const system = [
    "你是一个工作记忆 observation 精炼器。",
    "你的任务是根据工具调用结果，把 observation 压成更适合检索和回注的一条事实记录。",
    "输出必须是 JSON，对象字段只能是 content、outputSummary、tags、importance。",
    "content 必须是中文，描述已经得到的事实结果，不要复述无关路径，不要写闲聊。",
    "outputSummary 只在确实有助于后续理解时才填写。",
    "tags 应该是少量、高信息量的标签，避免通用废词。",
    "importance 必须是 0 到 1 之间的小数。",
    "禁止编造工具输出里没有出现的结论。",
  ].join("\n")

  const user = [
    `## Heuristic Observation`,
    JSON.stringify(
      {
        content: input.observation.content,
        outputSummary: input.observation.output.summary,
        tags: input.observation.retrieval.tags,
        importance: input.observation.retrieval.importance,
      },
      null,
      2,
    ),
    ``,
    `## Tool Input`,
    JSON.stringify(
      {
        tool: input.toolInput.tool,
        args: input.toolInput.args,
        title: input.output.title,
      },
      null,
      2,
    ),
    ``,
    `## Tool Output`,
    truncate(input.output.output, 1200),
  ].join("\n")

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ]
}

function normalizeText(value: string, max: number): string | undefined {
  const normalized = collapseWhitespace(stripMarkdownPrefix(value))
  if (!normalized) return undefined
  return truncate(normalized, max)
}

function normalizeTag(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = collapseWhitespace(value)
  return normalized || undefined
}

function stripMarkdownPrefix(value: string): string {
  return value
    .replace(/^\s*[-*]\s*/u, "")
    .replace(/^\s*#+\s*/u, "")
    .trim()
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`
}

function safeParseJson(value: string): Record<string, unknown> | null {
  const normalized = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
  try {
    const parsed = JSON.parse(normalized)
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.()
      reject(new Error(`Model observation request timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}
