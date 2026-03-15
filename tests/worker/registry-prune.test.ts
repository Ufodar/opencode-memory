import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { pruneWorkerRegistryRecords } from "../../src/worker/manager.js"
import {
  listWorkerRegistryRecords,
  writeWorkerRegistryRecord,
} from "../../src/worker/registry.js"

describe("memory worker registry pruning", () => {
  test("removes stale records while keeping healthy ones", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-registry-"))

    try {
      const registryPath = path.join(root, "worker-registry.json")

      writeWorkerRegistryRecord({
        registryPath,
        projectPath: "/workspace/live",
        databasePath: "/tmp/live.sqlite",
        port: 50101,
        pid: 101,
      })

      writeWorkerRegistryRecord({
        registryPath,
        projectPath: "/workspace/dead",
        databasePath: "/tmp/dead.sqlite",
        port: 50102,
        pid: 102,
      })

      const pruned = await pruneWorkerRegistryRecords(registryPath, {
        isPidAlive(pid) {
          return pid === 101
        },
      })

      expect(pruned).toBe(1)
      expect(listWorkerRegistryRecords(registryPath)).toHaveLength(1)
      expect(listWorkerRegistryRecords(registryPath)[0]?.projectPath).toBe("/workspace/live")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
