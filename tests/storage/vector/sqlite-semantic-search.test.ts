import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createStoredSemanticMemorySearch } from "../../../src/memory/vector/search-service.js"
import { SQLiteMemoryDatabase } from "../../../src/storage/sqlite/sqlite-memory-database.js"
import { SQLiteMemoryVectorRepository } from "../../../src/storage/sqlite/vector-repository.js"

describe("stored semantic memory search", () => {
  let tempDir: string
  let database: SQLiteMemoryDatabase
  let repository: SQLiteMemoryVectorRepository

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-memory-vector-"))
    database = new SQLiteMemoryDatabase(join(tempDir, "memory.sqlite"))
    repository = new SQLiteMemoryVectorRepository(database.handle)
  })

  afterEach(() => {
    database.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("returns summary-first semantic results and hides covered observations", async () => {
    repository.upsert({
      id: "sum_semantic",
      kind: "summary",
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      createdAt: 1,
      searchRecord: {
        kind: "summary",
        id: "sum_semantic",
        content: "完成 memory worker reuse",
        createdAt: 1,
        nextStep: "继续收紧 worker 生命周期",
      },
      coveredObservationIDs: ["obs_covered"],
      vector: new Float32Array([1, 0, 0]),
    })
    repository.upsert({
      id: "obs_covered",
      kind: "observation",
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      createdAt: 2,
      searchRecord: {
        kind: "observation",
        id: "obs_covered",
        content: "修复 worker 复用时的端口竞争",
        createdAt: 2,
        tool: "bash",
        importance: 0.9,
        tags: ["worker", "reuse"],
      },
      vector: new Float32Array([0.95, 0.05, 0]),
    })
    repository.upsert({
      id: "obs_other",
      kind: "observation",
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      createdAt: 3,
      searchRecord: {
        kind: "observation",
        id: "obs_other",
        content: "补 worker 健康检查日志",
        createdAt: 3,
        tool: "edit",
        importance: 0.7,
        tags: ["worker", "health"],
      },
      vector: new Float32Array([0.7, 0.3, 0]),
    })

    const service = createStoredSemanticMemorySearch({
      repository,
      dimensions: 3,
      backend: "exact-scan",
      embedQuery: async () => new Float32Array([0.98, 0.02, 0]),
    })

    const result = await service.search({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      query: "跨多次 run 复用后台进程",
      limit: 5,
    })

    expect(result.mode).toBe("semantic")
    expect(result.results.map((item) => item.id)).toEqual(["sum_semantic", "obs_other"])
    expect(result.results[0]?.kind).toBe("summary")
  })
})
