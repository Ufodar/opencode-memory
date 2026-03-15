import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  buildWorkerSpawnLockPath,
  tryAcquireWorkerSpawnLock,
} from "../../src/worker/spawn-lock.js"

describe("worker spawn lock", () => {
  test("derives a stable lock path from project and database path", () => {
    const first = buildWorkerSpawnLockPath({
      registryPath: "/tmp/worker-registry.json",
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })
    const second = buildWorkerSpawnLockPath({
      registryPath: "/tmp/worker-registry.json",
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    expect(first).toBe(second)
    expect(first.endsWith(".lock")).toBe(true)
  })

  test("reclaims a stale dead-owner lock", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-lock-"))

    try {
      const lockPath = path.join(root, "worker.lock")
      const first = tryAcquireWorkerSpawnLock(lockPath, {
        now: () => 1_000,
        pid: 100,
        isPidAlive() {
          return false
        },
        staleMs: 50,
      })
      expect(first).not.toBeUndefined()

      const second = tryAcquireWorkerSpawnLock(lockPath, {
        now: () => 1_200,
        pid: 200,
        isPidAlive(pid) {
          return pid === 200
        },
        staleMs: 50,
      })

      expect(second).not.toBeUndefined()
      second?.release()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
