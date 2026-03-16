import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const cleanupTasks: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const task = cleanupTasks.pop()
    if (task) {
      await task()
    }
  }
})

describe("memory worker status snapshot", () => {
  test("writes and reads the latest worker status snapshot", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "opencode-memory-status-"))
    cleanupTasks.push(() => rm(root, { recursive: true, force: true }))

    const snapshotPath = path.join(root, "worker-status.json")
    const { createMemoryWorkerStatusSnapshotStore } = await import("../../src/worker/worker-status-snapshot.js")

    const store = createMemoryWorkerStatusSnapshotStore(snapshotPath)
    store.write({
      updatedAt: 456,
      isProcessing: true,
      queueDepth: 2,
      counts: { pending: 1, processing: 1, failed: 0 },
      activeSessionIDs: ["ses_demo", "ses_prev"],
      lastEvent: {
        type: "start",
        sessionID: "ses_demo",
        jobID: 7,
        kind: "observation",
      },
      lastSessionCompletion: {
        sessionID: "ses_prev",
        completedAt: 455,
        summaryStatus: "summarized",
        requestAnchorID: "req_1",
        summaryID: "sum_1",
        checkpointObservationAt: 123,
      },
    })

    expect(store.read()).toEqual({
      updatedAt: 456,
      isProcessing: true,
      queueDepth: 2,
      counts: { pending: 1, processing: 1, failed: 0 },
      activeSessionIDs: ["ses_demo", "ses_prev"],
      lastEvent: {
        type: "start",
        sessionID: "ses_demo",
        jobID: 7,
        kind: "observation",
      },
      lastSessionCompletion: {
        sessionID: "ses_prev",
        completedAt: 455,
        summaryStatus: "summarized",
        requestAnchorID: "req_1",
        summaryID: "sum_1",
        checkpointObservationAt: 123,
      },
    })
  })
})
