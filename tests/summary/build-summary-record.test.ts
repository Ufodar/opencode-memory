import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { buildSummaryRecord } from "../../src/memory/summary/aggregate.js"

describe("buildSummaryRecord", () => {
  test("falls back to deterministic summary when model result is unavailable", async () => {
    const summary = await buildSummaryRecord({
      request: buildRequest(),
      observations: [buildObservation()],
      generateModelSummary: async () => null,
    })

    expect(summary.outcomeSummary).toContain("3条硬约束")
    expect(summary.nextStep).toBeUndefined()
    expect(summary.observationIDs).toEqual(["obs_1"])
  })

  test("overrides summary text with model-assisted result when available", async () => {
    const summary = await buildSummaryRecord({
      request: buildRequest(),
      observations: [buildObservation()],
      generateModelSummary: async () => ({
        outcomeSummary: "已完成资格条件抽取，并识别出1项待人工确认的材料缺口",
        nextStep: "输出缺口清单并等待人工确认",
      }),
    })

    expect(summary.outcomeSummary).toBe("已完成资格条件抽取，并识别出1项待人工确认的材料缺口")
    expect(summary.nextStep).toBe("输出缺口清单并等待人工确认")
    expect(summary.requestAnchorID).toBe("req_1")
    expect(summary.observationIDs).toEqual(["obs_1"])
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
