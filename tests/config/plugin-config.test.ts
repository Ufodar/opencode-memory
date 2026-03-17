import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  getOpenCodeMemoryConfig,
  getOpenCodeMemoryConfigPath,
  resolveConfiguredSecret,
} from "../../src/config/plugin-config.js"

const TEMP_ROOT = "/tmp/opencode-memory-plugin-config-tests"

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

describe("plugin config", () => {
  test("uses OPENCODE_MEMORY_CONFIG_PATH when provided", () => {
    expect(
      getOpenCodeMemoryConfigPath({
        OPENCODE_MEMORY_CONFIG_PATH: "/tmp/custom-memory.jsonc",
      } as NodeJS.ProcessEnv),
    ).toBe("/tmp/custom-memory.jsonc")
  })

  test("reads jsonc config from disk", () => {
    const configPath = join(TEMP_ROOT, "opencode-memory.jsonc")
    mkdirSync(TEMP_ROOT, { recursive: true })
    writeFileSync(
      configPath,
      `{
        // comments should be accepted
        "storagePath": "~/.opencode-memory/custom-data",
        "embeddingModel": "Qwen3-embedding",
        "embeddingDimensions": 4096
      }`,
    )

    const config = getOpenCodeMemoryConfig({
      env: {
        OPENCODE_MEMORY_CONFIG_PATH: configPath,
      } as NodeJS.ProcessEnv,
    })

    expect(config.storagePath).toBe("~/.opencode-memory/custom-data")
    expect(config.embeddingModel).toBe("Qwen3-embedding")
    expect(config.embeddingDimensions).toBe(4096)
  })

  test("resolves env:// and file:// secret values", () => {
    const secretPath = join(TEMP_ROOT, "secret.txt")
    mkdirSync(TEMP_ROOT, { recursive: true })
    writeFileSync(secretPath, "file-secret\n")

    expect(
      resolveConfiguredSecret("env://OPENAI_API_KEY", {
        env: {
          OPENAI_API_KEY: "env-secret",
        } as NodeJS.ProcessEnv,
      }),
    ).toBe("env-secret")

    expect(resolveConfiguredSecret(`file://${secretPath}`)).toBe("file-secret")
  })
})
