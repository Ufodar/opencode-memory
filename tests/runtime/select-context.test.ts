import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import type { ContinuityInjectionStore } from "../../src/continuity/contracts.js"
import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { SQLiteContinuityStore } from "../../src/storage/sqlite/continuity-store.js"
import { selectInjectionRecords } from "../../src/runtime/injection/select-context.js"

describe("selectInjectionRecords", () => {
  let tempDir: string
  let store: SQLiteContinuityStore & ContinuityInjectionStore

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-continuity-"))
    store = new SQLiteContinuityStore(join(tempDir, "continuity.sqlite"))
  })

  afterEach(() => {
    store.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("prefers session-scoped continuity when available", () => {
    store.saveSummary(buildSummary({ id: "sum_session", sessionID: "ses_current", createdAt: 20 }))
    store.saveSummary(buildSummary({ id: "sum_other", sessionID: "ses_other", createdAt: 30 }))

    const selected = selectInjectionRecords({
      store,
      projectPath: "/workspace/demo",
      sessionID: "ses_current",
      maxSummaries: 3,
      maxObservations: 5,
    })

    expect(selected.scope).toBe("session")
    expect(selected.summaries.map((item) => item.id)).toEqual(["sum_session"])
  })

  test("falls back to project scope when session has no continuity", () => {
    store.saveSummary(buildSummary({ id: "sum_project", sessionID: "ses_other", createdAt: 30 }))
    store.saveObservation(buildObservation({ id: "obs_project", sessionID: "ses_other", createdAt: 40 }))

    const selected = selectInjectionRecords({
      store,
      projectPath: "/workspace/demo",
      sessionID: "ses_empty",
      maxSummaries: 3,
      maxObservations: 5,
    })

    expect(selected.scope).toBe("project")
    expect(selected.summaries.map((item) => item.id)).toEqual(["sum_project"])
  })

  test("ignores internal continuity tool observations during injection selection", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_internal",
        sessionID: "ses_current",
        createdAt: 20,
        toolName: "memory_search",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_real",
        sessionID: "ses_current",
        createdAt: 30,
        toolName: "read",
      }),
    )

    const selected = selectInjectionRecords({
      store,
      projectPath: "/workspace/demo",
      sessionID: "ses_current",
      maxSummaries: 3,
      maxObservations: 5,
    })

    expect(selected.scope).toBe("session")
    expect(selected.observations.map((item) => item.id)).toEqual(["obs_real"])
  })

  test("ignores memory_timeline observations during injection selection", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_internal_timeline",
        sessionID: "ses_current",
        createdAt: 20,
        toolName: "memory_timeline",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_real",
        sessionID: "ses_current",
        createdAt: 30,
        toolName: "read",
      }),
    )

    const selected = selectInjectionRecords({
      store,
      projectPath: "/workspace/demo",
      sessionID: "ses_current",
      maxSummaries: 3,
      maxObservations: 5,
    })

    expect(selected.observations.map((item) => item.id)).toEqual(["obs_real"])
  })
})

function buildSummary(input: {
  id: string
  sessionID: string
  createdAt: number
}): SummaryRecord {
  return {
    id: input.id,
    sessionID: input.sessionID,
    projectPath: "/workspace/demo",
    requestAnchorID: "req_1",
    requestSummary: "抽取资格条件并检查缺材料",
    outcomeSummary: `${input.id} outcome`,
    nextStep: "输出缺口清单",
    observationIDs: [],
    createdAt: input.createdAt,
  }
}

function buildObservation(input: {
  id: string
  sessionID: string
  createdAt: number
  toolName?: string
}): ObservationRecord {
  return {
    id: input.id,
    content: `${input.id} content`,
    sessionID: input.sessionID,
    projectPath: "/workspace/demo",
    createdAt: input.createdAt,
    tool: {
      name: input.toolName ?? "read",
      callID: `call_${input.id}`,
      status: "success",
    },
    input: { summary: "读取文件" },
    output: { summary: `${input.id} output` },
    retrieval: { importance: 0.8, tags: ["observation"] },
    trace: {},
  }
}
