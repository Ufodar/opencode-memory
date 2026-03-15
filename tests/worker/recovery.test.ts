import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { recoverManagedMemoryWorkerProcess } from "../../src/worker/manager.js"
import {
  readWorkerRegistryRecord,
  writeWorkerRegistryRecord,
} from "../../src/worker/registry.js"

describe("managed memory worker recovery", () => {
  test("waits for a recently started worker to become healthy before discarding it", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-recovery-"))

    try {
      const registryPath = path.join(root, "worker-registry.json")
      const projectPath = "/workspace/demo"
      const databasePath = "/tmp/demo.sqlite"

      writeWorkerRegistryRecord({
        registryPath,
        projectPath,
        databasePath,
        port: 50123,
        pid: 42,
      })

      let now = 1_000
      let checks = 0

      const worker = await recoverManagedMemoryWorkerProcess(
        {
          projectPath,
          databasePath,
        },
        {
          registryPath,
          now: () => now,
          async checkHealth() {
            checks += 1
            return checks >= 3
          },
          async shutdown() {
            throw new Error("shutdown should not be called for recoverable worker")
          },
          isPidAlive() {
            return true
          },
          async sleep() {
            now += 100
          },
        },
      )

      expect(worker).not.toBeUndefined()
      expect(checks).toBe(3)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test("removes a stale registry record when the pid is already gone", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-recovery-"))

    try {
      const registryPath = path.join(root, "worker-registry.json")
      const projectPath = "/workspace/demo"
      const databasePath = "/tmp/demo.sqlite"

      writeWorkerRegistryRecord({
        registryPath,
        projectPath,
        databasePath,
        port: 50123,
        pid: 42,
      })

      const worker = await recoverManagedMemoryWorkerProcess(
        {
          projectPath,
          databasePath,
        },
        {
          registryPath,
          now: () => 10_000,
          async checkHealth() {
            return false
          },
          async shutdown() {},
          isPidAlive() {
            return false
          },
          async sleep() {},
        },
      )

      expect(worker).toBeUndefined()
      expect(
        readWorkerRegistryRecord({
          registryPath,
          projectPath,
          databasePath,
        }),
      ).toBeUndefined()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
