import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import { selectCheckpointObservations } from "../../src/memory/summary/aggregate.js"

describe("selectCheckpointObservations", () => {
  test("cuts a checkpoint before the newest phase block when phase changes", () => {
    const observations = [
      buildObservation({
        id: "obs_1",
        toolName: "read",
        content: "读取资格条件正文，定位到3条硬约束",
        createdAt: 10,
      }),
      buildObservation({
        id: "obs_2",
        toolName: "grep",
        content: "搜索资格条件附表，发现业绩要求字段",
        createdAt: 20,
      }),
      buildObservation({
        id: "obs_3",
        toolName: "write",
        content: "开始写缺口清单初稿",
        createdAt: 30,
      }),
    ]

    const selected = selectCheckpointObservations({ observations })

    expect(selected.map((item) => item.id)).toEqual(["obs_1", "obs_2"])
  })

  test("keeps observations through a decision signal", () => {
    const observations = [
      buildObservation({
        id: "obs_1",
        toolName: "read",
        content: "读取资格条件正文，定位到3条硬约束",
        createdAt: 10,
      }),
      buildObservation({
        id: "obs_2",
        toolName: "write",
        content: "形成决策：先输出缺口清单，不进入正式写作",
        createdAt: 20,
      }),
    ]

    const selected = selectCheckpointObservations({ observations })

    expect(selected.map((item) => item.id)).toEqual(["obs_1", "obs_2"])
  })

  test("allows a single execution observation to form a checkpoint", () => {
    const observations = [
      buildObservation({
        id: "obs_1",
        toolName: "write",
        content: "写出缺口清单初稿",
        createdAt: 10,
      }),
    ]

    const selected = selectCheckpointObservations({ observations })

    expect(selected.map((item) => item.id)).toEqual(["obs_1"])
  })

  test("allows a single bash verification observation to form a checkpoint", () => {
    const observations = [
      buildObservation({
        id: "obs_1",
        toolName: "bash",
        content: "运行 bun test，全部通过",
        createdAt: 10,
        inputSummary: JSON.stringify({ command: "bun test" }),
      }),
    ]

    const selected = selectCheckpointObservations({ observations })

    expect(selected.map((item) => item.id)).toEqual(["obs_1"])
  })

  test("does not treat generic output wording as a decision signal", () => {
    const observations = [
      buildObservation({
        id: "obs_1",
        toolName: "read",
        content: "读取资格条件正文，定位到3条硬约束",
        createdAt: 10,
      }),
      buildObservation({
        id: "obs_2",
        toolName: "write",
        content: "生成缺口清单初稿",
        createdAt: 20,
      }),
    ]

    const selected = selectCheckpointObservations({ observations })

    expect(selected.map((item) => item.id)).toEqual([])
  })
})

function buildObservation(input: {
  id: string
  toolName: string
  content: string
  createdAt: number
  inputSummary?: string
  phase?: ObservationRecord["phase"]
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: input.createdAt,
    phase: input.phase,
    tool: {
      name: input.toolName,
      callID: `call_${input.id}`,
      status: "success",
    },
    input: {
      summary: input.inputSummary ?? "执行工具",
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
