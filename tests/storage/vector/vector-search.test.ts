import { describe, expect, test } from "bun:test"

import {
  createExactScanVectorIndex,
  createSemanticMemorySearch,
} from "../../../src/memory/vector/search-service.js"

describe("semantic memory search", () => {
  test("returns semantic hits even when literal fallback is empty", async () => {
    const index = createExactScanVectorIndex()
    await index.upsert({
      id: "obs_semantic",
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      vector: new Float32Array([1, 0, 0]),
    })

    const service = createSemanticMemorySearch({
      index,
      embedQuery: async () => new Float32Array([0.9, 0.1, 0]),
      fallbackSearch: () => [],
    })

    const result = await service.search({
      projectPath: "/workspace/demo",
      sessionID: "ses_demo",
      query: "解决启动时监听地址被占用",
      limit: 5,
    })

    expect(result.mode).toBe("semantic")
    expect(result.ids).toEqual(["obs_semantic"])
  })

  test("falls back to text search when semantic retrieval is unavailable", async () => {
    const service = createSemanticMemorySearch({
      index: createExactScanVectorIndex(),
      embedQuery: async () => {
        throw new Error("embedding offline")
      },
      fallbackSearch: () => ["sum_text"],
    })

    const result = await service.search({
      projectPath: "/workspace/demo",
      query: "资格条件",
      limit: 5,
    })

    expect(result.mode).toBe("fallback")
    expect(result.ids).toEqual(["sum_text"])
  })
})
