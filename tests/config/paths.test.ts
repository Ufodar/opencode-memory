import { describe, expect, test } from "bun:test"

import { getDefaultWorkerStatusPath } from "../../src/config/paths.js"

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
})
