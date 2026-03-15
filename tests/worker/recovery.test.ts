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
          expectedVersion: "0.1.0",
          now: () => now,
          async getHealth() {
            checks += 1
            return checks >= 3
              ? {
                  ok: true,
                  version: "0.1.0",
                }
              : undefined
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
          expectedVersion: "0.1.0",
          now: () => 10_000,
          async getHealth() {
            return undefined
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

  test("removes recovered worker when version does not match current plugin version", async () => {
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

      let shutdowns = 0

      const worker = await recoverManagedMemoryWorkerProcess(
        {
          projectPath,
          databasePath,
        },
        {
          registryPath,
          expectedVersion: "0.2.0",
          now: () => 10_000,
          async getHealth() {
            return {
              ok: true,
              version: "0.1.0",
            }
          },
          async shutdown() {
            shutdowns += 1
          },
          isPidAlive() {
            return true
          },
          async sleep() {},
        },
      )

      expect(worker).toBeUndefined()
      expect(shutdowns).toBe(1)
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
