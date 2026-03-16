import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { buildSummaryRecord } from "../../src/memory/summary/aggregate.js"
import { captureToolObservation } from "../../src/runtime/hooks/tool-after.js"

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

  test("deterministic summary reuses semantic read observations instead of path shorthand", async () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
        args: {
          filePath: "/workspace/demo/brief.txt",
        },
        projectPath: "/workspace/demo",
      },
      {
        title: "",
        output: `<path>/workspace/demo/brief.txt</path>
<type>file</type>
<content>1: 这是一个真实 OpenCode 宿主 smoke 测试文件。
2:
3: 目标：
4: 1. 让 agent 使用 read 工具读取这个文件。
5: 2. 让 opencode-memory 通过 tool.execute.after 写入 observation。

(End of file - total 5 lines)
</content>`,
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()

    const summary = await buildSummaryRecord({
      request: buildRequest(),
      observations: [observation!],
      generateModelSummary: async () => null,
    })

    expect(summary.outcomeSummary).toContain("真实 OpenCode 宿主 smoke 测试文件")
    expect(summary.outcomeSummary).not.toContain("read: /workspace/demo/brief.txt")
  })

  test("deterministic summary deduplicates repeated outcome bits", async () => {
    const summary = await buildSummaryRecord({
      request: buildRequest(),
      observations: [
        buildObservationWithContent("已提取第3章资格条件并发现材料缺口"),
        buildObservationWithContent("已提取第3章资格条件并发现材料缺口"),
        buildObservationWithContent("补充确认：仍需人工核实业绩证明年限"),
      ],
      generateModelSummary: async () => null,
    })

    expect(summary.outcomeSummary).toContain("已提取第3章资格条件并发现材料缺口")
    expect(summary.outcomeSummary).toContain("仍需人工核实业绩证明年限")
    expect(summary.outcomeSummary.match(/已提取第3章资格条件并发现材料缺口/gu)?.length).toBe(1)
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
  return buildObservationWithContent("读取第3章资格条件并定位到3条硬约束", "发现3条硬约束和1项待确认字段")
}

function buildObservationWithContent(
  content: string,
  outputSummary = content,
): ObservationRecord {
  return {
    id: "obs_1",
    content,
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
      summary: outputSummary,
    },
    retrieval: {
      importance: 0.92,
      tags: ["observation", "requirements"],
    },
    trace: {},
  }
}
