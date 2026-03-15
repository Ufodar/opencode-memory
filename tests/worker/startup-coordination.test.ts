import { describe, expect, test } from "bun:test"

import { coordinateManagedMemoryWorkerStartup } from "../../src/worker/manager.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"

function createProcess(id: string) {
  return {
    worker: {
      async searchMemoryRecords() {
        return {
          scope: "session" as const,
          results: [{ kind: "summary" as const, id, content: id, createdAt: 1 }],
        }
      },
    } as unknown as MemoryWorkerService,
    async isHealthy() {
      return true
    },
    async stop() {},
  }
}

describe("memory worker startup coordination", () => {
  test("waits for peer startup to recover an existing worker instead of spawning a second one", async () => {
    let spawned = 0
    let recoveries = 0
    let lockAttempts = 0

    const process = await coordinateManagedMemoryWorkerStartup(
      {
        projectPath: "/workspace/demo",
        databasePath: "/tmp/demo.sqlite",
      },
      {
        async recover() {
          recoveries += 1
          if (recoveries < 3) {
            return undefined
          }
          return createProcess("sum_recovered")
        },
        async spawn() {
          spawned += 1
          return createProcess("sum_spawned")
        },
        tryAcquireLock() {
          lockAttempts += 1
          if (lockAttempts < 3) {
            return undefined
          }
          return {
            release() {},
          }
        },
        async sleep() {},
        now: (() => {
          let now = 0
          return () => {
            now += 100
            return now
          }
        })(),
      },
    )

    expect(spawned).toBe(0)
    await expect(
      process.worker.searchMemoryRecords({
        sessionID: "ses_demo",
        query: "资格条件",
        limit: 5,
      }),
    ).resolves.toMatchObject({
      results: [{ id: "sum_recovered" }],
    })
  })

  test("spawns a worker when startup lock becomes available and nothing is recovered", async () => {
    let spawned = 0
    let attempts = 0

    const process = await coordinateManagedMemoryWorkerStartup(
      {
        projectPath: "/workspace/demo",
        databasePath: "/tmp/demo.sqlite",
      },
      {
        async recover() {
          return undefined
        },
        async spawn() {
          spawned += 1
          return createProcess("sum_spawned")
        },
        tryAcquireLock() {
          attempts += 1
          if (attempts < 2) {
            return undefined
          }
          return {
            release() {},
          }
        },
        async sleep() {},
        now: (() => {
          let now = 0
          return () => {
            now += 100
            return now
          }
        })(),
      },
    )

    expect(spawned).toBe(1)
    await expect(
      process.worker.searchMemoryRecords({
        sessionID: "ses_demo",
        query: "资格条件",
        limit: 5,
      }),
    ).resolves.toMatchObject({
      results: [{ id: "sum_spawned" }],
    })
  })
})
