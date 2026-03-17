import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { getEmbeddingConfig } from "../../../src/services/ai/embedding-config.js"

const TEMP_ROOT = "/tmp/opencode-memory-embedding-config-tests"

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

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

  test("reads embedding config from opencode-memory.jsonc when env vars are absent", () => {
    const configPath = join(TEMP_ROOT, "opencode-memory.jsonc")
    mkdirSync(TEMP_ROOT, { recursive: true })
    writeFileSync(
      configPath,
      JSON.stringify({
        embeddingApiUrl: "http://127.0.0.1:3000/v1",
        embeddingApiKey: "env://EMBEDDING_API_KEY",
        embeddingModel: "Qwen3-embedding",
        embeddingDimensions: 4096,
        vectorBackend: "exact-scan",
      }),
    )

    const config = getEmbeddingConfig({
      OPENCODE_MEMORY_CONFIG_PATH: configPath,
      EMBEDDING_API_KEY: "file-backed-secret",
    } as NodeJS.ProcessEnv)

    expect(config).toEqual({
      apiUrl: "http://127.0.0.1:3000/v1",
      apiKey: "file-backed-secret",
      model: "Qwen3-embedding",
      dimensions: 4096,
      backend: "exact-scan",
    })
  })
})
