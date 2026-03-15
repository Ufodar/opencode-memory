import { describe, expect, test } from "bun:test"

import { createPendingJobProcessor } from "../../src/worker/pending-job-processor.js"
import type {
  PendingJobRecord,
  PendingJobStore,
} from "../../src/worker/pending-jobs.js"

describe("pending job processor", () => {
  test("replays pending jobs in order for a session", async () => {
    const calls: string[] = []
    const pending: PendingJobRecord[] = [
      {
        id: 1,
        sessionID: "ses_demo",
        kind: "request-anchor",
        payload: { sessionID: "ses_demo", messageID: "msg_1", text: "梳理第3章资格条件" },
        status: "pending",
        attemptCount: 0,
        createdAt: 1,
        updatedAt: 1,
        lastError: null,
      },
      {
        id: 2,
        sessionID: "ses_demo",
        kind: "session-idle",
        payload: { sessionID: "ses_demo" },
        status: "pending",
        attemptCount: 0,
        createdAt: 2,
        updatedAt: 2,
        lastError: null,
      },
    ]

    const store: PendingJobStore = {
      enqueue() {
        throw new Error("not needed")
      },
      claimNext(sessionID) {
        const next = pending.find((job) => job.sessionID === sessionID && job.status === "pending") ?? null
        if (!next) return null
        next.status = "processing"
        next.attemptCount += 1
        return next
      },
      complete(id) {
        const index = pending.findIndex((job) => job.id === id)
        if (index >= 0) pending.splice(index, 1)
      },
      releaseForRetry(id, error) {
        const job = pending.find((entry) => entry.id === id)
        if (job) {
          job.status = "pending"
          job.lastError = error
        }
      },
      listSessionIDsWithPendingJobs() {
        return Array.from(new Set(pending.filter((job) => job.status === "pending").map((job) => job.sessionID)))
      },
      resetProcessingToPending() {
        for (const job of pending) {
          if (job.status === "processing") {
            job.status = "pending"
          }
        }
        return pending.length
      },
    }

    const processor = createPendingJobProcessor({
      store,
      scheduler: {
        run(_sessionID, task) {
          return task()
        },
        enqueue(_sessionID, job) {
          void job()
        },
      },
      worker: {
        captureRequestAnchorFromMessage(input) {
          calls.push(`request:${input.sessionID}:${input.messageID}`)
          return null
        },
        captureObservationFromToolCall() {
          calls.push("observation")
          return null
        },
        handleSessionIdle(sessionID) {
          calls.push(`summary:${sessionID}`)
          return { status: "summarized", requestAnchorID: "msg_1", summaryID: "sum_1", checkpointObservationAt: 2 }
        },
      },
    })

    await processor.processSessionJobs("ses_demo")

    expect(calls).toEqual([
      "request:ses_demo:msg_1",
      "summary:ses_demo",
    ])
    expect(pending).toHaveLength(0)
  })

  test("resumes persisted jobs by resetting processing rows and scheduling each session", async () => {
    const scheduled: string[] = []

    const store: PendingJobStore = {
      enqueue() {
        throw new Error("not needed")
      },
      claimNext() {
        return null
      },
      complete() {},
      releaseForRetry() {},
      listSessionIDsWithPendingJobs() {
        return ["ses_a", "ses_b"]
      },
      resetProcessingToPending() {
        return 2
      },
    }

    const processor = createPendingJobProcessor({
      store,
      scheduler: {
        run(_sessionID, task) {
          return task()
        },
        enqueue(sessionID, job) {
          scheduled.push(sessionID)
          void job()
        },
      },
      worker: {
        captureRequestAnchorFromMessage() {
          return null
        },
        captureObservationFromToolCall() {
          return null
        },
        handleSessionIdle() {
          return { status: "missing-request" as const }
        },
      },
    })

    const resetCount = processor.resumePendingJobs()

    expect(resetCount).toBe(2)
    expect(scheduled).toEqual(["ses_a", "ses_b"])
  })
})
