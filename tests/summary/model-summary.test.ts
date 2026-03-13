import { afterEach, describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import {
  generateModelSummary,
  getModelSummaryConfig,
} from "../../src/services/ai/model-summary.js"

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe("model summary", () => {
  test("returns null when model summary config is missing", async () => {
    delete process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL
    delete process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY
    delete process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL

    expect(getModelSummaryConfig()).toBeNull()

    const result = await generateModelSummary({
      request: buildRequest(),
      observations: [buildObservation()],
    })

    expect(result).toBeNull()
  })

  test("parses a valid OpenAI-compatible response", async () => {
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY = "test-key"
    process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL = "gpt-test"

    const result = await generateModelSummary(
      {
        request: buildRequest(),
        observations: [buildObservation()],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      outcomeSummary: "已完成资格条件抽取，并发现1项材料缺口",
                      nextStep: "输出缺口清单并等待人工确认",
                    }),
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    )

    expect(result).toEqual({
      outcomeSummary: "已完成资格条件抽取，并发现1项材料缺口",
      nextStep: "输出缺口清单并等待人工确认",
    })
  })

  test("returns null when model response is malformed", async () => {
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY = "test-key"
    process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL = "gpt-test"

    const result = await generateModelSummary(
      {
        request: buildRequest(),
        observations: [buildObservation()],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: "not-json",
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    )

    expect(result).toBeNull()
  })

  test("normalizes multiline markdown-ish model output", async () => {
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY = "test-key"
    process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL = "gpt-test"

    const result = await generateModelSummary(
      {
        request: buildRequest(),
        observations: [buildObservation()],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: "```json\n{\"outcomeSummary\":\"- 已完成资格条件抽取，\\n并发现1项材料缺口。\",\"nextStep\":\"  输出缺口清单并等待人工确认。  \"}\n```",
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    )

    expect(result).toEqual({
      outcomeSummary: "已完成资格条件抽取，并发现1项材料缺口。",
      nextStep: "输出缺口清单并等待人工确认。",
    })
  })

  test("drops weak nextStep and truncates overly long outcomeSummary", async () => {
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY = "test-key"
    process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL = "gpt-test"

    const longSummary = "已完成资格条件抽取".repeat(30)

    const result = await generateModelSummary(
      {
        request: buildRequest(),
        observations: [buildObservation()],
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      outcomeSummary: longSummary,
                      nextStep: "继续处理",
                    }),
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      },
    )

    expect(result?.outcomeSummary.length).toBeLessThanOrEqual(160)
    expect(result?.nextStep).toBeUndefined()
  })

  test("returns null when model request exceeds timeout", async () => {
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_CONTINUITY_SUMMARY_API_KEY = "test-key"
    process.env.OPENCODE_CONTINUITY_SUMMARY_MODEL = "gpt-test"

    const result = await generateModelSummary(
      {
        request: buildRequest(),
        observations: [buildObservation()],
      },
      {
        timeoutMs: 5,
        fetchImpl: async () =>
          await new Promise<Response>(() => {
            // Never resolves - simulates a hung provider request
          }),
      },
    )

    expect(result).toBeNull()
  })
})

function buildRequest(): RequestAnchorRecord {
  return {
    id: "req_1",
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    content: "抽取资格条件并判断是否缺材料",
    createdAt: 10,
  }
}

function buildObservation(): ObservationRecord {
  return {
    id: "obs_1",
    content: "读取第3章资格条件并定位到3条硬约束",
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: 20,
    tool: {
      name: "read",
      callID: "call_obs_1",
      status: "success",
    },
    input: {
      summary: "读取招标文件第3章",
    },
    output: {
      summary: "发现3条硬约束和1项待确认字段",
    },
    retrieval: {
      importance: 0.92,
      tags: ["observation", "requirements"],
    },
    trace: {},
  }
}
