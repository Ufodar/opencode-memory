import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { buildSystemContinuityContext } from "../../src/runtime/injection/system-context.js"

describe("buildSystemContinuityContext", () => {
  test("prefers summaries and excludes observations already covered by injected summaries", () => {
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
      }),
      buildObservation({
        id: "obs_2",
        content: "发现缺少近三年类似业绩证明材料",
      }),
      buildObservation({
        id: "obs_3",
        content: "写入缺口清单初稿到 questions.md",
      }),
    ]

    const system = buildSystemContinuityContext({ summaries, observations })
    const text = system.join("\n")

    expect(text).toContain("[CONTINUITY]")
    expect(text).toContain("Recent summaries:")
    expect(text).toContain("输出缺口清单")
    expect(text).toContain("Recent unsummarized observations:")
    expect(text).toContain("写入缺口清单初稿")
    expect(text).not.toContain("读取第3章资格条件并定位到3条硬约束")
    expect(text).not.toContain("发现缺少近三年类似业绩证明材料")
  })

  test("falls back to observations when no summaries exist", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取 requirements.csv 并发现 evidence_source 列缺失",
      }),
    ]

    const system = buildSystemContinuityContext({
      scope: "project",
      summaries: [],
      observations,
    })

    const text = system.join("\n")
    expect(text).toContain("Scope: project continuity")
    expect(text).not.toContain("Recent summaries:")
    expect(text).toContain("Recent observations:")
    expect(text).toContain("evidence_source")
  })

  test("shows observation phases when falling back to observations", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取 requirements.csv 并发现 evidence_source 列缺失",
        phase: "research",
      }),
    ]

    const system = buildSystemContinuityContext({
      scope: "session",
      summaries: [],
      observations,
    })

    const text = system.join("\n")
    expect(text).toContain("Scope: current session continuity")
    expect(text).toContain("[research] 读取 requirements.csv 并发现 evidence_source 列缺失")
  })

  test("respects count and character budgets", () => {
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

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "第一条 observation 可能会被预算裁掉",
      }),
      buildObservation({
        id: "obs_2",
        content: "第二条 observation 也不一定能留下",
      }),
    ]

    const system = buildSystemContinuityContext({
      summaries,
      observations,
      maxSummaries: 1,
      maxObservations: 1,
      maxChars: 120,
    })

    const text = system.join("\n")
    expect(text).toContain("第一个很长的总结")
    expect(text).not.toContain("第二个总结不应该被纳入")
    expect(text.length).toBeLessThanOrEqual(120)
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
