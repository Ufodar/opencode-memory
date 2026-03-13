import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import { ContinuityStore } from "../../src/storage/sqlite/continuity-store.js"

describe("ContinuityStore", () => {
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

  test("persists and lists recent observations by project path", () => {
    const observation = buildObservation({
      id: "obs_1",
      projectPath: "/workspace/demo",
      content: "读取第3章资格条件并发现3条硬约束",
    })

    store.saveObservation(observation)

    const results = store.listRecentObservations({
      projectPath: "/workspace/demo",
      limit: 5,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe("obs_1")
    expect(results[0]?.content).toContain("硬约束")
  })

  test("searches stored observations by content", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_requirements",
        projectPath: "/workspace/demo",
        content: "在招标文件第3章发现资格条件和业绩要求",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_write",
        projectPath: "/workspace/demo",
        content: "写入初版目录到投标文件草稿",
      }),
    )

    const results = store.searchObservations({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 10,
    })

    expect(results.map((item) => item.id)).toEqual(["obs_requirements"])
  })

  test("loads exact observations by ids", () => {
    store.saveObservation(
      buildObservation({
        id: "obs_a",
        projectPath: "/workspace/demo",
        content: "读取 requirements.csv 并发现缺少一列 evidence_source",
      }),
    )
    store.saveObservation(
      buildObservation({
        id: "obs_b",
        projectPath: "/workspace/demo",
        content: "完成 qc-report.md 初稿",
      }),
    )

    const results = store.getObservationsByIds(["obs_b", "obs_a"])

    expect(results).toHaveLength(2)
    expect(results.map((item) => item.id)).toEqual(["obs_a", "obs_b"])
  })
})

function buildObservation(input: {
  id: string
  projectPath: string
  content: string
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: input.projectPath,
    createdAt: 1_700_000_000_000,
    tool: {
      name: "read",
      callID: `call_${input.id}`,
      title: "读取文件",
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
      tags: ["read", "observation"],
    },
    trace: {
      filePaths: ["/workspace/demo/source.md"],
    },
  }
}
