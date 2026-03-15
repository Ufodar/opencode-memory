import { describe, expect, test } from "bun:test"

import { createManagedMemoryWorkerManager } from "../../src/worker/manager.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"

describe("managed memory worker manager", () => {
  test("reuses one worker process for the same project until the final handle stops", async () => {
    let created = 0
    let stopped = 0

    const manager = createManagedMemoryWorkerManager({
      registerProcessCleanup() {},
      async createProcess() {
        created += 1
        return {
          worker: {} as MemoryWorkerService,
          async isHealthy() {
            return true
          },
          async stop() {
            stopped += 1
          },
        }
      },
    })

    const first = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })
    const second = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    expect(created).toBe(1)

    await first.stop()
    expect(stopped).toBe(0)

    await second.stop()
    expect(stopped).toBe(1)
  })

  test("replaces an unhealthy worker before handing out a new handle", async () => {
    let created = 0
    let stopped = 0
    let healthy = true

    const manager = createManagedMemoryWorkerManager({
      registerProcessCleanup() {},
      async createProcess() {
        created += 1
        const worker = { id: `worker_${created}` } as unknown as MemoryWorkerService

        return {
          worker,
          async isHealthy() {
            return healthy
          },
          async stop() {
            stopped += 1
          },
        }
      },
    })

    const first = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    healthy = false

    const second = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    expect(created).toBe(2)
    expect(stopped).toBe(1)
    expect(first.worker).not.toBe(second.worker)

    await first.stop()
    await second.stop()
    expect(stopped).toBe(2)
  })

  test("stop handle is idempotent", async () => {
    let stopped = 0

    const manager = createManagedMemoryWorkerManager({
      registerProcessCleanup() {},
      async createProcess() {
        return {
          worker: {} as MemoryWorkerService,
          async isHealthy() {
            return true
          },
          async stop() {
            stopped += 1
          },
        }
      },
    })

    const handle = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    await handle.stop()
    await handle.stop()

    expect(stopped).toBe(1)
  })

  test("leased worker handle self-heals by replacing an unhealthy process", async () => {
    let created = 0
    let currentHealthy = true

    const manager = createManagedMemoryWorkerManager({
      registerProcessCleanup() {},
      async createProcess() {
        created += 1
        const version = created

        return {
          worker: {
            async searchMemoryRecords() {
              return {
                scope: "session",
                results: [
                  {
                    kind: "summary" as const,
                    id: `sum_${version}`,
                    content: `worker_${version}`,
                    createdAt: version,
                  },
                ],
              }
            },
          } as unknown as MemoryWorkerService,
          async isHealthy() {
            return currentHealthy
          },
          async stop() {},
        }
      },
    })

    const handle = await manager.start({
      projectPath: "/workspace/demo",
      databasePath: "/tmp/demo.sqlite",
    })

    currentHealthy = false

    const result = await handle.worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "资格条件",
      limit: 5,
    })

    expect(created).toBe(2)
    expect(result.results[0]?.id).toBe("sum_2")

    await handle.stop()
  })
})
