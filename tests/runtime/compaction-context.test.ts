import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { buildCompactionMemoryContext } from "../../src/runtime/injection/compaction-context.js"

describe("buildCompactionMemoryContext", () => {
  test("prefers summaries and only keeps unsummarized observations", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        nextStep: "输出缺口清单",
        observationIDs: ["obs_1", "obs_2"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取第3章资格条件并定位到3条硬约束",
        phase: "research",
      }),
      buildObservation({
        id: "obs_2",
        content: "发现缺少近三年类似业绩证明材料",
        phase: "research",
      }),
      buildObservation({
        id: "obs_3",
        content: "写入缺口清单初稿到 questions.md",
        phase: "execution",
      }),
    ]

    const context = buildCompactionMemoryContext({ summaries, observations })
    const text = context.join("\n")

    expect(text).toContain("[CONTINUITY CHECKPOINTS]")
    expect(text).toContain("Recent memory summaries:")
    expect(text).toContain("输出缺口清单")
    expect(text).toContain("Recent unsummarized observations:")
    expect(text).toContain("[execution] 写入缺口清单初稿到 questions.md")
    expect(text).not.toContain("读取第3章资格条件并定位到3条硬约束")
    expect(text).not.toContain("发现缺少近三年类似业绩证明材料")
  })

  test("respects compaction character budget", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "A",
        outcomeSummary: "第一个很长的总结，用来占据大部分预算",
        observationIDs: [],
        createdAt: 10,
      },
      {
        id: "sum_2",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_2",
        requestSummary: "B",
        outcomeSummary: "第二个总结不应该被纳入",
        observationIDs: [],
        createdAt: 20,
      },
    ]

    const context = buildCompactionMemoryContext({
      summaries,
      observations: [],
      maxChars: 220,
      maxSummaries: 1,
    })

    const text = context.join("\n")
    expect(text).toContain("第一个很长的总结")
    expect(text).not.toContain("第二个总结不应该被纳入")
    expect(text.length).toBeLessThanOrEqual(220)
  })
})

function buildObservation(input: {
  id: string
  content: string
  phase?: ObservationRecord["phase"]
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: 10,
    phase: input.phase,
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
      importance: 0.8,
      tags: ["observation"],
    },
    trace: {},
  }
}
