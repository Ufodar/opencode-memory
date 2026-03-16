import { describe, expect, test } from "bun:test"

import { flushActiveMemorySessions } from "../../src/runtime/final-flush.js"

describe("flushActiveMemorySessions", () => {
  test("completes active worker sessions from most recent to least recent", async () => {
    const calls: string[] = []

    await flushActiveMemorySessions({
      worker: {
        async getQueueStatus() {
          return {
            isProcessing: false,
            queueDepth: 0,
            counts: { pending: 0, processing: 0, failed: 0 },
            processingJobs: [],
            failedJobs: [],
            workerStatus: {
              updatedAt: 1,
              isProcessing: false,
              queueDepth: 0,
              counts: { pending: 0, processing: 0, failed: 0 },
              activeSessionIDs: ["ses_old", "ses_new"],
              lastEvent: { type: "worker-started" as const },
            },
          }
        },
        async completeSession(sessionID) {
          calls.push(sessionID)
          return {
            status: "completed" as const,
            sessionID,
            summaryStatus: "no-op" as const,
          }
        },
      },
      log() {},
    })

    expect(calls).toEqual(["ses_old", "ses_new"])
  })

  test("continues flushing other sessions when one completion fails", async () => {
    const calls: string[] = []

    await flushActiveMemorySessions({
      worker: {
        async getQueueStatus() {
          return {
            isProcessing: false,
            queueDepth: 0,
            counts: { pending: 0, processing: 0, failed: 0 },
            processingJobs: [],
            failedJobs: [],
            workerStatus: {
              updatedAt: 1,
              isProcessing: false,
              queueDepth: 0,
              counts: { pending: 0, processing: 0, failed: 0 },
              activeSessionIDs: ["ses_next", "ses_fail"],
              lastEvent: { type: "worker-started" as const },
            },
          }
        },
        async completeSession(sessionID) {
          calls.push(sessionID)
          if (sessionID === "ses_fail") {
            throw new Error("boom")
          }
          return {
            status: "completed" as const,
            sessionID,
            summaryStatus: "no-op" as const,
          }
        },
      },
      log() {},
    })

    expect(calls).toEqual(["ses_next", "ses_fail"])
  })

  test("skips flushing when worker has no active sessions", async () => {
    const calls: string[] = []

    await flushActiveMemorySessions({
      worker: {
        async getQueueStatus() {
          return {
            isProcessing: false,
            queueDepth: 0,
            counts: { pending: 0, processing: 0, failed: 0 },
            processingJobs: [],
            failedJobs: [],
            workerStatus: {
              updatedAt: 1,
              isProcessing: false,
              queueDepth: 0,
              counts: { pending: 0, processing: 0, failed: 0 },
              activeSessionIDs: [],
              lastEvent: { type: "worker-started" as const },
            },
          }
        },
        async completeSession(sessionID) {
          calls.push(sessionID)
          return {
            status: "completed" as const,
            sessionID,
            summaryStatus: "no-op" as const,
          }
        },
      },
      log() {},
    })

    expect(calls).toEqual([])
  })
})
