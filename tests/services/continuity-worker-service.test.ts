import { describe, expect, test } from "bun:test"

import type { ContinuityIdleSummaryStore, ContinuityInjectionStore } from "../../src/continuity/contracts.js"
import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { createContinuityWorkerService } from "../../src/services/continuity-worker-service.js"

describe("createContinuityWorkerService", () => {
  test("captures and saves a request anchor from chat message text", () => {
    const saved: RequestAnchorRecord[] = []

    const worker = createContinuityWorkerService({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore & ContinuityInjectionStore,
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      saveRequestAnchor(record) {
        saved.push(record)
      },
      captureRequestAnchor(input) {
        return {
          id: input.messageID ?? "req_1",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
          content: input.text,
          createdAt: 1,
        }
      },
    })

    const request = worker.captureRequestAnchorFromMessage({
      sessionID: "ses_demo",
      messageID: "msg_1",
      text: "梳理第3章资格条件",
    })

    expect(request?.id).toBe("msg_1")
    expect(saved).toHaveLength(1)
    expect(saved[0]?.content).toBe("梳理第3章资格条件")
  })

  test("captures and saves an observation from tool execution", () => {
    const saved: ObservationRecord[] = []

    const worker = createContinuityWorkerService({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore & ContinuityInjectionStore,
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      saveObservation(record) {
        saved.push(record)
      },
      captureToolObservation(input) {
        return {
          id: "obs_1",
          content: "发现3条约束",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
          createdAt: 1,
          tool: {
            name: input.tool,
            callID: input.callID,
            status: "success",
          },
          input: { summary: "读取第3章" },
          output: { summary: "发现3条约束" },
          retrieval: { importance: 0.9, tags: ["read", "observation"] },
          trace: {},
        }
      },
    })

    const observation = worker.captureObservationFromToolCall(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
        args: { filePath: "招标文件.docx" },
      },
      {
        title: "读取招标文件",
        output: "第3章资格条件",
        metadata: {},
      },
    )

    expect(observation?.id).toBe("obs_1")
    expect(saved).toHaveLength(1)
    expect(saved[0]?.content).toBe("发现3条约束")
  })

  test("runs idle summary behind the session guard", async () => {
    const calls: string[] = []

    const worker = createContinuityWorkerService({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore & ContinuityInjectionStore,
      idleSummaryGuard: {
        async run(sessionID, task) {
          calls.push(`guard:${sessionID}`)
          const result = await task()
          return { ran: true, result }
        },
      },
      runIdleSummaryPipeline: async (input) => {
        calls.push(`pipeline:${input.sessionID}`)
        return { status: "missing-request" }
      },
    })

    const result = await worker.handleSessionIdle("ses_demo")

    expect(result).toEqual({ status: "missing-request" })
    expect(calls).toEqual(["guard:ses_demo", "pipeline:ses_demo"])
  })

  test("selects injection records through the worker service", () => {
    const calls: string[] = []

    const worker = createContinuityWorkerService({
      projectPath: "/workspace/demo",
      store: {} as ContinuityIdleSummaryStore & ContinuityInjectionStore,
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      selectInjectionRecords() {
        calls.push("select")
        return {
          scope: "session",
          summaries: [],
          observations: [],
        }
      },
    })

    const result = worker.selectInjectionRecords({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
    })

    expect(result.scope).toBe("session")
    expect(calls).toEqual(["select"])
  })

  test("falls back from session search to project search inside the worker", () => {
    const calls: Array<{ sessionID?: string; scope?: "session" | "project" }> = []

    const worker = createContinuityWorkerService({
      projectPath: "/workspace/demo",
      store: {
        saveRequestAnchor() {},
        saveObservation() {},
        getLatestRequestAnchor() {
          return null
        },
        listObservationsForRequestWindow() {
          return []
        },
        saveSummary() {},
        updateRequestAnchorCheckpoint() {},
        listRecentSummaries() {
          return []
        },
        listRecentObservations() {
          return []
        },
        searchContinuityRecords(input) {
          calls.push({ sessionID: input.sessionID, scope: input.sessionID ? "session" : "project" })
          if (input.sessionID) return []
          return [
            {
              kind: "summary" as const,
              id: "sum_project",
              content: "project result",
              createdAt: 1,
            },
          ]
        },
        getContinuityDetails() {
          return []
        },
        getContinuityTimeline() {
          return null
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
    })

    const result = worker.searchContinuityRecords({
      sessionID: "ses_demo",
      query: "brief",
      limit: 5,
    })

    expect(calls).toEqual([
      { sessionID: "ses_demo", scope: "session" },
      { sessionID: undefined, scope: "project" },
    ])
    expect(result.scope).toBe("project")
    expect(result.results[0]?.id).toBe("sum_project")
  })
})
