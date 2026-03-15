import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { SQLiteMemoryStore } from "../../src/storage/sqlite/memory-store.js"

describe("SQLiteMemoryStore request anchors and summaries", () => {
  let tempDir: string
  let store: SQLiteMemoryStore

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-memory-"))
    store = new SQLiteMemoryStore(join(tempDir, "memory.sqlite"))
  })

  afterEach(() => {
    store.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("returns latest request anchor for a session even after a checkpoint", () => {
    store.saveRequestAnchor(buildRequestAnchor({ id: "req_1", createdAt: 10 }))
    store.saveRequestAnchor(buildRequestAnchor({ id: "req_2", createdAt: 20 }))
    store.updateRequestAnchorCheckpoint({
      id: "req_2",
      summarizedAt: 30,
      lastCheckpointObservationAt: 25,
    })

    const latest = store.getLatestRequestAnchor({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
    })

    expect(latest?.id).toBe("req_2")
    expect(latest?.lastCheckpointObservationAt).toBe(25)
  })

  test("lists only new observations after the last checkpoint boundary", () => {
    store.saveObservation(buildObservation({ id: "obs_1", createdAt: 15, content: "先读到三条资格条件" }))
    store.saveObservation(buildObservation({ id: "obs_2", createdAt: 25, content: "发现一项材料缺口" }))
    store.saveObservation(buildObservation({ id: "obs_3", createdAt: 35, content: "形成决策：先输出缺口清单" }))

    const results = store.listObservationsForRequestWindow({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      afterCreatedAtExclusive: 25,
    })

    expect(results.map((item) => item.id)).toEqual(["obs_3"])
  })

  test("persists and lists recent summaries by project path", () => {
    store.saveSummary(
      buildSummary({
        id: "sum_1",
        createdAt: 40,
        outcomeSummary: "已识别第3章资格条件，并发现1项材料缺口",
      }),
    )

    const results = store.listRecentSummaries({
      projectPath: "/workspace/demo",
      limit: 5,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe("sum_1")
    expect(results[0]?.outcomeSummary).toContain("材料缺口")
  })
})

function buildRequestAnchor(input: {
  id: string
  createdAt: number
}): RequestAnchorRecord {
  return {
    id: input.id,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    content: "抽取资格条件并检查缺材料",
    createdAt: input.createdAt,
  }
}

function buildSummary(input: {
  id: string
  createdAt: number
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
    observationIDs: ["obs_1", "obs_2"],
    createdAt: input.createdAt,
  }
}

function buildObservation(input: {
  id: string
  createdAt: number
  content: string
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
      importance: 0.8,
      tags: ["observation"],
    },
    trace: {},
  }
}
