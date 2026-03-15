import { describe, expect, test } from "bun:test"

import type { MemoryIdleSummaryStore } from "../../src/memory/contracts.js"
import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { runIdleSummaryPipeline } from "../../src/runtime/pipelines/idle-summary-pipeline.js"

describe("runIdleSummaryPipeline", () => {
  test("returns without saving when request has no aggregatable observations", async () => {
    const savedSummaries: SummaryRecord[] = []
    const checkpointUpdates: Array<{
      id: string
      summarizedAt: number
      lastCheckpointObservationAt: number
    }> = []

    const result = await runIdleSummaryPipeline({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      store: {
        getLatestRequestAnchor: () => buildRequestAnchor(),
        listObservationsForRequestWindow: () => [],
        saveSummary: (summary) => {
          savedSummaries.push(summary)
        },
        updateRequestAnchorCheckpoint: (update) => {
          checkpointUpdates.push(update)
        },
      } satisfies MemoryIdleSummaryStore,
    })

    expect(result.status).toBe("no-op")
    expect(savedSummaries).toHaveLength(0)
    expect(checkpointUpdates).toHaveLength(0)
  })

  test("saves a summary and advances the checkpoint when observations are available", async () => {
    const savedSummaries: SummaryRecord[] = []
    const checkpointUpdates: Array<{
      id: string
      summarizedAt: number
      lastCheckpointObservationAt: number
    }> = []

    const result = await runIdleSummaryPipeline({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      store: {
        getLatestRequestAnchor: () => buildRequestAnchor(),
        listObservationsForRequestWindow: () => [
          buildObservation({
            id: "obs_1",
            createdAt: 20,
            content: "读取资格条件并确认3条硬约束",
          }),
          buildObservation({
            id: "obs_2",
            createdAt: 30,
            content: "形成决策：先输出缺口清单",
            phase: "decision",
          }),
        ],
        saveSummary: (summary) => {
          savedSummaries.push(summary)
        },
        updateRequestAnchorCheckpoint: (update) => {
          checkpointUpdates.push(update)
        },
      } satisfies MemoryIdleSummaryStore,
    })

    expect(result.status).toBe("summarized")
    expect(savedSummaries).toHaveLength(1)
    expect(savedSummaries[0]?.observationIDs).toEqual(["obs_1", "obs_2"])
    expect(checkpointUpdates).toHaveLength(1)
    expect(checkpointUpdates[0]?.id).toBe("req_1")
    expect(checkpointUpdates[0]?.lastCheckpointObservationAt).toBe(30)
  })
})

function buildRequestAnchor(): RequestAnchorRecord {
  return {
    id: "req_1",
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    content: "抽取资格条件并判断是否缺材料",
    createdAt: 10,
  }
}

function buildObservation(input: {
  id: string
  createdAt: number
  content: string
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
      importance: 0.9,
      tags: ["observation"],
    },
    trace: {},
  }
}
