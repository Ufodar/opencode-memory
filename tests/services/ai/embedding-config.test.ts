import { describe, expect, test } from "bun:test"

import { getEmbeddingConfig } from "../../../src/services/ai/embedding-config.js"

describe("getEmbeddingConfig", () => {
  test("returns null when required env vars are missing", () => {
    expect(getEmbeddingConfig({} as NodeJS.ProcessEnv)).toBeNull()
  })

  test("reads OpenAI-compatible embedding config from OPENCODE_MEMORY_EMBEDDING_* env vars", () => {
    const config = getEmbeddingConfig({
      OPENCODE_MEMORY_EMBEDDING_API_URL: "http://127.0.0.1:3000/v1",
      OPENCODE_MEMORY_EMBEDDING_API_KEY: "sk-test",
      OPENCODE_MEMORY_EMBEDDING_MODEL: "Qwen3-embedding",
      OPENCODE_MEMORY_EMBEDDING_DIMENSIONS: "4096",
      OPENCODE_MEMORY_VECTOR_BACKEND: "usearch",
    } as NodeJS.ProcessEnv)

    expect(config).toEqual({
      apiUrl: "http://127.0.0.1:3000/v1",
      apiKey: "sk-test",
      model: "Qwen3-embedding",
      dimensions: 4096,
      backend: "usearch",
    })
  })

  test("defaults vector backend to usearch when omitted", () => {
    const config = getEmbeddingConfig({
      OPENCODE_MEMORY_EMBEDDING_API_URL: "http://127.0.0.1:3000/v1",
      OPENCODE_MEMORY_EMBEDDING_API_KEY: "sk-test",
      OPENCODE_MEMORY_EMBEDDING_MODEL: "Qwen3-embedding",
      OPENCODE_MEMORY_EMBEDDING_DIMENSIONS: "4096",
    } as NodeJS.ProcessEnv)

    expect(config?.backend).toBe("usearch")
  })
})
