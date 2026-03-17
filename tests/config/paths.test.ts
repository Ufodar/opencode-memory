import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  getDefaultDatabasePath,
  getDefaultWorkerStatusPath,
} from "../../src/config/paths.js"

const TEMP_ROOT = "/tmp/opencode-memory-paths-tests"

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

describe("memory worker status paths", () => {
  test("derives a stable per-worker status path from project and database path", () => {
    const first = getDefaultWorkerStatusPath({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })
    const second = getDefaultWorkerStatusPath({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    expect(first).toBe(second)
    expect(first).toContain(".opencode-memory/data/worker-status-")
  })

  test("uses different status paths for different worker keys", () => {
    const first = getDefaultWorkerStatusPath({
      projectPath: "/workspace/demo-a",
      databasePath: "/tmp/demo.sqlite",
    })
    const second = getDefaultWorkerStatusPath({
      projectPath: "/workspace/demo-b",
      databasePath: "/tmp/demo.sqlite",
    })

    expect(first).not.toBe(second)
  })

  test("uses storagePath from opencode-memory config when provided", () => {
    const configPath = join(TEMP_ROOT, "opencode-memory.jsonc")
    mkdirSync(TEMP_ROOT, { recursive: true })
    writeFileSync(
      configPath,
      JSON.stringify({
        storagePath: "/tmp/custom-opencode-memory-data",
      }),
    )

    const databasePath = getDefaultDatabasePath({
      OPENCODE_MEMORY_CONFIG_PATH: configPath,
    } as NodeJS.ProcessEnv)

    expect(databasePath).toBe("/tmp/custom-opencode-memory-data/memory.sqlite")
  })
})
