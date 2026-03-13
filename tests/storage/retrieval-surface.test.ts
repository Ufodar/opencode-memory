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
})

function buildSummary(input: {
  id: string
  outcomeSummary: string
}): SummaryRecord {
  return {
    id: input.id,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    requestAnchorID: "req_1",
    requestSummary: "抽取资格条件并检查缺材料",
    outcomeSummary: input.outcomeSummary,
    nextStep: "输出缺口清单",
    observationIDs: ["obs_1"],
    createdAt: 20,
  }
}

function buildObservation(input: {
  id: string
  content: string
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: 10,
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
