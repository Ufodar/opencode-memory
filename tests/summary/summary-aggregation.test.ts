import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { summarizeRequestWindow } from "../../src/memory/summary/aggregate.js"

describe("summarizeRequestWindow", () => {
  test("builds a deterministic summary from a request anchor and observation batch", () => {
    const request = buildRequestAnchor({
      id: "req_1",
      content: "抽取第3章资格条件，并判断是否缺材料",
    })

    const observations = [
      buildObservation({
        id: "obs_1",
        content: "读取第3章资格条件，定位到3条硬约束",
        createdAt: 10,
        importance: 0.82,
      }),
      buildObservation({
        id: "obs_2",
        content: "在材料目录中未发现近三年类似业绩证明",
        createdAt: 20,
        importance: 0.78,
      }),
      buildObservation({
        id: "obs_3",
        content: "形成决策：先输出缺口清单，不进入正式写作",
        createdAt: 30,
        importance: 0.93,
      }),
    ]

    const summary = summarizeRequestWindow({
      request,
      observations,
    })

    expect(summary.requestAnchorID).toBe("req_1")
    expect(summary.projectPath).toBe("/workspace/demo")
    expect(summary.requestSummary).toContain("资格条件")
    expect(summary.outcomeSummary).toContain("3条硬约束")
    expect(summary.nextStep).toContain("缺口清单")
    expect(summary.observationIDs).toEqual(["obs_1", "obs_2", "obs_3"])
  })
})

function buildRequestAnchor(input: {
  id: string
  content: string
}): RequestAnchorRecord {
  return {
    id: input.id,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    content: input.content,
    createdAt: 1,
  }
}

function buildObservation(input: {
  id: string
  content: string
  createdAt: number
  importance: number
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: input.createdAt,
    tool: {
      name: "read",
      callID: `call_${input.id}`,
      status: "success",
    },
    input: {
      summary: "读取文件",
    },
    output: {
      summary: input.content,
    },
    retrieval: {
      importance: input.importance,
      tags: ["observation"],
    },
    trace: {},
  }
}
