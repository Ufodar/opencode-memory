import type { ObservationRecord } from "../../memory/observation/types.js"
import type { RequestAnchorRecord } from "../../memory/request/types.js"
import { log } from "../logger.js"

export interface ModelSummaryConfig {
  apiUrl: string
  apiKey: string
  model: string
}

export interface ModelSummaryResult {
  outcomeSummary: string
  nextStep?: string
}

export function getModelSummaryConfig(env: NodeJS.ProcessEnv = process.env): ModelSummaryConfig | null {
  const apiUrl = env.OPENCODE_CONTINUITY_SUMMARY_API_URL?.trim()
  const apiKey = env.OPENCODE_CONTINUITY_SUMMARY_API_KEY?.trim()
  const model = env.OPENCODE_CONTINUITY_SUMMARY_MODEL?.trim()

  if (!apiUrl || !apiKey || !model) return null

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    apiKey,
    model,
  }
}

export async function generateModelSummary(
  input: {
    request: RequestAnchorRecord
    observations: ObservationRecord[]
  },
  deps: {
    env?: NodeJS.ProcessEnv
    fetchImpl?: typeof fetch
  } = {},
): Promise<ModelSummaryResult | null> {
  const config = getModelSummaryConfig(deps.env ?? process.env)
  if (!config) return null

  const fetchImpl = deps.fetchImpl ?? fetch

  try {
    const response = await fetchImpl(`${config.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: buildMessages(input),
        temperature: 0.2,
        response_format: {
          type: "json_object",
        },
      }),
    })

    if (!response.ok) {
      log("model summary request failed", {
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
    if (!parsed || typeof parsed.outcomeSummary !== "string" || !parsed.outcomeSummary.trim()) {
      return null
    }

    return {
      outcomeSummary: parsed.outcomeSummary.trim(),
      nextStep: typeof parsed.nextStep === "string" && parsed.nextStep.trim()
        ? parsed.nextStep.trim()
        : undefined,
    }
  } catch (error) {
    log("model summary generation failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

function buildMessages(input: {
  request: RequestAnchorRecord
  observations: ObservationRecord[]
}) {
  const system = [
    "你是一个 memory continuity summary 生成器。",
    "你的任务是把一个 request checkpoint 里的 observation 压成简短、准确、可回注的阶段摘要。",
    "输出必须是 JSON，对象字段只有 outcomeSummary 和 nextStep。",
    "outcomeSummary 必须是中文，聚焦已经完成的事实结果，不要写闲聊或过程口号。",
    "nextStep 只有在 observation 中已经出现明确下一步时才填写。",
  ].join("\n")

  const user = [
    `## Request`,
    input.request.content,
    ``,
    `## Observations`,
    ...input.observations.map((item, index) =>
      `${index + 1}. [${item.tool.name}] ${item.output.summary || item.content}`),
  ].join("\n")

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ]
}

function safeParseJson(value: string): Record<string, unknown> | null {
  const normalized = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
  try {
    const parsed = JSON.parse(normalized)
    return typeof parsed === "object" && parsed ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}
