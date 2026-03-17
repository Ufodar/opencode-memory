import { afterEach, describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import {
  generateModelObservation,
  getModelObservationConfig,
} from "../../src/services/ai/model-observation.js"

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe("model observation", () => {
  test("returns null when model observation config is missing", async () => {
    delete process.env.OPENCODE_MEMORY_OBSERVATION_API_URL
    delete process.env.OPENCODE_MEMORY_OBSERVATION_API_KEY
    delete process.env.OPENCODE_MEMORY_OBSERVATION_MODEL

    expect(getModelObservationConfig()).toBeNull()

    const result = await generateModelObservation({
      toolInput: buildToolInput(),
      output: buildOutput(),
      observation: buildObservation(),
    })

    expect(result).toBeNull()
  })

  test("parses a valid OpenAI-compatible response", async () => {
    process.env.OPENCODE_MEMORY_OBSERVATION_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_MEMORY_OBSERVATION_API_KEY = "test-key"
    process.env.OPENCODE_MEMORY_OBSERVATION_MODEL = "gpt-test"

    const result = await generateModelObservation(
      {
        toolInput: buildToolInput(),
        output: buildOutput(),
        observation: buildObservation(),
      },
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      content: "已定位到第3章资格条件，共 3 条硬约束。",
                      outputSummary: "资格条件共 3 条，其中 1 条仍需人工核实。",
                      tags: ["requirements", "eligibility"],
                      importance: 0.86,
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
      content: "已定位到第3章资格条件，共 3 条硬约束。",
      outputSummary: "资格条件共 3 条，其中 1 条仍需人工核实。",
      tags: ["requirements", "eligibility"],
      importance: 0.86,
    })
  })

  test("returns null when model request exceeds timeout", async () => {
    process.env.OPENCODE_MEMORY_OBSERVATION_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_MEMORY_OBSERVATION_API_KEY = "test-key"
    process.env.OPENCODE_MEMORY_OBSERVATION_MODEL = "gpt-test"

    const result = await generateModelObservation(
      {
        toolInput: buildToolInput(),
        output: buildOutput(),
        observation: buildObservation(),
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

  test("requests English observation content by default", async () => {
    process.env.OPENCODE_MEMORY_OBSERVATION_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_MEMORY_OBSERVATION_API_KEY = "test-key"
    process.env.OPENCODE_MEMORY_OBSERVATION_MODEL = "gpt-test"
    delete process.env.OPENCODE_MEMORY_OUTPUT_LANGUAGE

    let systemPrompt = ""

    await generateModelObservation(
      {
        toolInput: buildToolInput(),
        output: buildOutput(),
        observation: buildObservation(),
      },
      {
        fetchImpl: async (_input, init) => {
          const payload = JSON.parse(String(init?.body)) as {
            messages: Array<{ role: string; content: string }>
          }
          systemPrompt = payload.messages[0]?.content ?? ""

          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      content: "Found three hard constraints in the eligibility section.",
                    }),
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          )
        },
      },
    )

    expect(systemPrompt).toContain("content must be in English")
  })

  test("allows Chinese observation output policy explicitly", async () => {
    process.env.OPENCODE_MEMORY_OBSERVATION_API_URL = "https://api.example.com/v1"
    process.env.OPENCODE_MEMORY_OBSERVATION_API_KEY = "test-key"
    process.env.OPENCODE_MEMORY_OBSERVATION_MODEL = "gpt-test"
    process.env.OPENCODE_MEMORY_OUTPUT_LANGUAGE = "zh"

    let systemPrompt = ""

    await generateModelObservation(
      {
        toolInput: buildToolInput(),
        output: buildOutput(),
        observation: buildObservation(),
      },
      {
        fetchImpl: async (_input, init) => {
          const payload = JSON.parse(String(init?.body)) as {
            messages: Array<{ role: string; content: string }>
          }
          systemPrompt = payload.messages[0]?.content ?? ""

          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      content: "已定位到第3章资格条件，共 3 条硬约束。",
                    }),
                  },
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          )
        },
      },
    )

    expect(systemPrompt).toContain("content 必须是中文")
  })
})

function buildToolInput() {
  return {
    tool: "read",
    sessionID: "ses_demo",
    callID: "call_1",
    args: {
      filePath: "/workspace/demo/招标文件.docx",
    },
  }
}

function buildOutput() {
  return {
    title: "读取第3章资格条件",
    output: "资格条件包括近三年类似业绩、项目经理资质和安全生产许可。",
    metadata: {},
  }
}

function buildObservation(): ObservationRecord {
  return {
    id: "obs_1",
    content: "启发式 observation",
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: 1,
    phase: "research",
    tool: {
      name: "read",
      callID: "call_1",
      status: "success",
    },
    input: {
      summary: "读取第3章资格条件",
    },
    output: {
      summary: "启发式输出摘要",
    },
    retrieval: {
      importance: 0.6,
      tags: ["read", "observation"],
    },
    trace: {},
  }
}
