import { describe, expect, test } from "bun:test"

import { createPendingJobProcessor } from "../../src/worker/pending-job-processor.js"
import type {
  PendingJobRecord,
  PendingJobStore,
} from "../../src/worker/pending-jobs.js"

describe("pending job processor", () => {
  test("logs queue state transitions when a job is enqueued and completed", async () => {
    const calls: string[] = []
    const logs: Array<{ message: string; metadata?: Record<string, unknown> }> = []
    const statuses: Array<Record<string, unknown>> = []
    const pending: PendingJobRecord[] = []

    const store: PendingJobStore = {
      enqueue(input) {
        const next: PendingJobRecord = {
          id: 1,
          sessionID: input.sessionID,
          kind: input.kind,
          payload: input.payload as PendingJobRecord["payload"],
          status: "pending",
          attemptCount: 0,
          createdAt: 1,
          updatedAt: 1,
          lastError: null,
        } as PendingJobRecord
        pending.push(next)
        return next.id
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
      recordFailure() {
        return "pending"
      },
      listSessionIDsWithPendingJobs() {
        return []
      },
      resetProcessingToPending() {
        return 0
      },
      listProcessingJobs() {
        return []
      },
      listFailedJobs() {
        return []
      },
      retryJob() {
        return false
      },
      getQueueStats() {
        const pendingCount = pending.filter((job) => job.status === "pending").length
        const processingCount = pending.filter((job) => job.status === "processing").length
        return {
          pending: pendingCount,
          processing: processingCount,
          failed: 0,
        }
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
          return null
        },
        handleSessionIdle() {
          return { status: "missing-request" as const }
        },
      },
      log(message, metadata) {
        logs.push({ message, metadata })
      },
      publishWorkerStatus(snapshot) {
        statuses.push(snapshot as Record<string, unknown>)
      },
    })

    processor.enqueueRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(calls).toEqual(["request:ses_demo:msg_1"])
    expect(logs).toContainEqual(
      expect.objectContaining({
        message: "memory queue enqueued job",
        metadata: expect.objectContaining({
          sessionID: "ses_demo",
          kind: "request-anchor",
          queueDepth: 1,
        }),
      }),
    )
    expect(logs).toContainEqual(
      expect.objectContaining({
        message: "memory queue started job",
        metadata: expect.objectContaining({
          sessionID: "ses_demo",
          kind: "request-anchor",
          queueDepth: 1,
        }),
      }),
    )
    expect(logs).toContainEqual(
      expect.objectContaining({
        message: "memory queue completed job",
        metadata: expect.objectContaining({
          sessionID: "ses_demo",
          kind: "request-anchor",
          queueDepth: 0,
        }),
      }),
    )
    expect(statuses.at(-1)).toEqual(
      expect.objectContaining({
        isProcessing: false,
        queueDepth: 0,
        lastEvent: expect.objectContaining({
          type: "complete",
          sessionID: "ses_demo",
          jobID: 1,
          kind: "request-anchor",
        }),
      }),
    )
  })

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
      recordFailure(id, error) {
        const job = pending.find((entry) => entry.id === id)
        if (job) {
          job.status = "pending"
          job.lastError = error
        }
        return "pending"
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
      listProcessingJobs() {
        return []
      },
      listFailedJobs() {
        return []
      },
      retryJob() {
        return false
      },
      getQueueStats() {
        return {
          pending: pending.filter((job) => job.status === "pending").length,
          processing: pending.filter((job) => job.status === "processing").length,
          failed: pending.filter((job) => job.status === "failed").length,
        }
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
      recordFailure() {
        return "pending"
      },
      listSessionIDsWithPendingJobs() {
        return ["ses_a", "ses_b"]
      },
      resetProcessingToPending() {
        return 2
      },
      listProcessingJobs() {
        return []
      },
      listFailedJobs() {
        return []
      },
      retryJob() {
        return false
      },
      getQueueStats() {
        return { pending: 0, processing: 0, failed: 0 }
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

  test("marks permanently failing job as failed and continues later jobs in the same session", async () => {
    const calls: string[] = []
    const logs: Array<{ message: string; metadata?: Record<string, unknown> }> = []
    const failedIds: number[] = []
    const pending: PendingJobRecord[] = [
      {
        id: 1,
        sessionID: "ses_demo",
        kind: "request-anchor",
        payload: { sessionID: "ses_demo", messageID: "msg_1", text: "梳理第3章资格条件" },
        status: "pending",
        attemptCount: 1,
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
        return next
      },
      complete(id) {
        const index = pending.findIndex((job) => job.id === id)
        if (index >= 0) pending.splice(index, 1)
      },
      recordFailure(id, error) {
        const job = pending.find((entry) => entry.id === id)
        if (!job) return "failed"
        job.status = "failed"
        job.lastError = error
        failedIds.push(id)
        return "failed"
      },
      listSessionIDsWithPendingJobs() {
        return []
      },
      resetProcessingToPending() {
        return 0
      },
      listProcessingJobs() {
        return []
      },
      listFailedJobs() {
        return []
      },
      retryJob() {
        return false
      },
      getQueueStats() {
        return {
          pending: pending.filter((job) => job.status === "pending").length,
          processing: pending.filter((job) => job.status === "processing").length,
          failed: pending.filter((job) => job.status === "failed").length,
        }
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
        captureRequestAnchorFromMessage() {
          throw new Error("persistent failure")
        },
        captureObservationFromToolCall() {
          return null
        },
        handleSessionIdle(sessionID) {
          calls.push(`summary:${sessionID}`)
          return { status: "summarized" as const, requestAnchorID: "msg_1", summaryID: "sum_1", checkpointObservationAt: 2 }
        },
      },
      log(message, metadata) {
        logs.push({ message, metadata })
      },
    })

    await processor.processSessionJobs("ses_demo")

    expect(failedIds).toEqual([1])
    expect(calls).toEqual(["summary:ses_demo"])
    expect(pending).toEqual([
      expect.objectContaining({
        id: 1,
        status: "failed",
        lastError: "persistent failure",
      }),
    ])
    expect(logs).toContainEqual(
      expect.objectContaining({
        message: "memory queue failed job",
        metadata: expect.objectContaining({
          sessionID: "ses_demo",
          kind: "request-anchor",
          failureStatus: "failed",
        }),
      }),
    )
  })
})
