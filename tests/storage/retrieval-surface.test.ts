import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { ContinuityStore } from "../../src/storage/sqlite/continuity-store.js"

describe("ContinuityStore retrieval surface", () => {
  let tempDir: string
  let store: ContinuityStore

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-continuity-"))
    store = new ContinuityStore(join(tempDir, "continuity.sqlite"))
  })

  afterEach(() => {
    store.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("returns summary-first results for continuity search", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_1",
        outcomeSummary: "已完成资格条件抽取，并确认存在业绩证明缺口",
        observationIDs: ["obs_other"],
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_1",
        content: "读取第3章资格条件并发现3条硬约束",
      }),
    )

    const results = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results).toHaveLength(2)
    expect(results[0]?.kind).toBe("summary")
    expect(results[0]?.id).toBe("sum_1")
    expect(results[1]?.kind).toBe("observation")
    expect(results[1]?.id).toBe("obs_1")
  })

  test("returns mixed details for summary and observation ids", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_1",
        outcomeSummary: "已识别材料缺口并暂停正式写作",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_1",
        content: "形成决策：先输出缺口清单",
      }),
    )

    const results = store.getContinuityDetails(["sum_1", "obs_1"])

    expect(results).toHaveLength(2)
    expect(results.map((item) => item.kind)).toEqual(["summary", "observation"])
  })

  test("supports session and project scope for search", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_session",
        outcomeSummary: "当前会话已完成资格条件抽取",
        sessionID: "ses_current",
      }),
    )
    store.saveSummary(
      buildSummary({
        id: "sum_other",
        outcomeSummary: "其他会话已完成资格条件抽取",
        sessionID: "ses_other",
      }),
    )

    const sessionResults = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      sessionID: "ses_current",
      query: "资格条件",
      limit: 10,
    })
    const projectResults = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(sessionResults.map((item) => item.id)).toEqual(["sum_session"])
    expect(projectResults.map((item) => item.id)).toEqual(["sum_session", "sum_other"])
  })

  test("hides observations already covered by returned summaries", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_1",
        outcomeSummary: "已完成资格条件抽取，并确认存在材料缺口",
        observationIDs: ["obs_1"],
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_1",
        content: "读取第3章资格条件并发现3条硬约束",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_2",
        content: "补充读取资格条件附表，发现业绩年限描述仍需核实",
      }),
    )

    const results = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results.map((item) => item.id)).toEqual(["sum_1", "obs_2"])
  })

  test("ranks summaries by stronger outcome matches before weaker request-only matches", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_request_only",
        requestSummary: "资格条件梳理",
        outcomeSummary: "已完成材料盘点",
        createdAt: 30,
      }),
    )
    store.saveSummary(
      buildSummary({
        id: "sum_outcome_match",
        requestSummary: "材料梳理",
        outcomeSummary: "已完成资格条件抽取，并确认存在材料缺口",
        createdAt: 20,
      }),
    )

    const results = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results.slice(0, 2).map((item) => item.id)).toEqual([
      "sum_outcome_match",
      "sum_request_only",
    ])
  })

  test("ranks equally matching observations by importance before recency", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_low_recent",
        content: "读取资格条件附表并记录1条补充要求",
        createdAt: 30,
        importance: 0.6,
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_high_older",
        content: "读取资格条件正文并确认核心准入约束",
        createdAt: 20,
        importance: 0.95,
      }),
    )

    const results = store.searchContinuityRecords({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results.filter((item) => item.kind === "observation").map((item) => item.id)).toEqual([
      "obs_high_older",
      "obs_low_recent",
    ])
  })
})

function buildSummary(input: {
  id: string
  outcomeSummary: string
  sessionID?: string
  observationIDs?: string[]
  requestSummary?: string
  createdAt?: number
}): SummaryRecord {
  return {
    id: input.id,
    sessionID: input.sessionID ?? "ses_demo",
    projectPath: "/workspace/demo",
    requestAnchorID: "req_1",
    requestSummary: input.requestSummary ?? "抽取资格条件并检查缺材料",
    outcomeSummary: input.outcomeSummary,
    nextStep: "输出缺口清单",
    observationIDs: input.observationIDs ?? ["obs_1"],
    createdAt: input.createdAt ?? 20,
  }
}

function buildObservation(input: {
  id: string
  content: string
  createdAt?: number
  importance?: number
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: input.createdAt ?? 10,
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
      importance: input.importance ?? 0.8,
      tags: ["observation"],
    },
    trace: {},
  }
}
