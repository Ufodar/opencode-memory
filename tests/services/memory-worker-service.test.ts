import { describe, expect, test } from "bun:test"

import type { MemoryIdleSummaryStore, MemoryInjectionStore } from "../../src/memory/contracts.js"
import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { createMemoryWorkerService } from "../../src/services/memory-worker-service.js"

describe("createMemoryWorkerService", () => {
  test("captures and saves a request anchor from chat message text", () => {
    const saved: RequestAnchorRecord[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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

  test("captures and saves an observation from tool execution", async () => {
    const saved: ObservationRecord[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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

    const observation = await worker.captureObservationFromToolCall(
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

  test("prefers model-assisted observation refinement when available", async () => {
    const saved: ObservationRecord[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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
          content: "启发式 observation",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
          createdAt: 1,
          tool: {
            name: input.tool,
            callID: input.callID,
            status: "success",
          },
          input: { summary: "读取第3章" },
          output: { summary: "启发式输出摘要" },
          retrieval: { importance: 0.6, tags: ["read", "observation"] },
          trace: {
            workingDirectory: "/workspace/demo",
            filesRead: ["/workspace/demo/brief.txt"],
          },
        }
      },
      generateModelObservation: async () => ({
        content: "模型精炼后的 observation",
        outputSummary: "模型精炼后的输出摘要",
        tags: ["requirements", "eligibility"],
        importance: 0.88,
      }),
    } as Parameters<typeof createMemoryWorkerService>[0] & {
      generateModelObservation: () => Promise<{
        content: string
        outputSummary?: string
        tags?: string[]
        importance?: number
      }>
    })

    const observation = await worker.captureObservationFromToolCall(
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

    expect(observation?.content).toBe("模型精炼后的 observation")
    expect(observation?.output.summary).toBe("模型精炼后的输出摘要")
    expect(observation?.retrieval.tags).toEqual(["requirements", "eligibility"])
    expect(observation?.retrieval.importance).toBe(0.88)
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filesRead: ["/workspace/demo/brief.txt"],
    })
    expect(saved[0]?.content).toBe("模型精炼后的 observation")
  })

  test("falls back to deterministic observation when model refinement content is blank", async () => {
    const saved: ObservationRecord[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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
          content: "启发式 observation",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
          createdAt: 1,
          tool: {
            name: input.tool,
            callID: input.callID,
            status: "success",
          },
          input: { summary: "读取第3章" },
          output: { summary: "启发式输出摘要" },
          retrieval: { importance: 0.6, tags: ["read", "observation"] },
          trace: {
            workingDirectory: "/workspace/demo",
            filesRead: ["/workspace/demo/brief.txt"],
          },
        }
      },
      generateModelObservation: async () => ({
        content: "   ",
        outputSummary: "   ",
      }),
    } as Parameters<typeof createMemoryWorkerService>[0] & {
      generateModelObservation: () => Promise<{
        content: string
        outputSummary?: string
      }>
    })

    const observation = await worker.captureObservationFromToolCall(
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

    expect(observation?.content).toBe("启发式 observation")
    expect(observation?.output.summary).toBe("启发式输出摘要")
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filesRead: ["/workspace/demo/brief.txt"],
    })
    expect(saved[0]?.content).toBe("启发式 observation")
  })

  test("runs idle summary behind the session guard", async () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {
        getMemoryDetails() {
          return [
            {
              kind: "summary" as const,
              id: "sum_1",
              content: "先整理资格条件，再补缺口清单。",
              createdAt: 2,
              requestSummary: "梳理第3章资格条件",
              observationIDs: ["obs_1", "obs_2"],
              coveredObservations: [],
            },
          ]
        },
      } as MemoryIdleSummaryStore & MemoryInjectionStore,
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

  test("completes a session by running the idle summary pipeline first", async () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {
        getMemoryDetails() {
          return [
            {
              kind: "summary" as const,
              id: "sum_1",
              content: "先整理资格条件，再补缺口清单。",
              createdAt: 2,
              requestSummary: "梳理第3章资格条件",
              observationIDs: ["obs_1", "obs_2"],
              coveredObservations: [],
            },
          ]
        },
      } as MemoryIdleSummaryStore & MemoryInjectionStore,
      idleSummaryGuard: {
        async run(sessionID, task) {
          calls.push(`guard:${sessionID}`)
          const result = await task()
          return { ran: true, result }
        },
      },
      runIdleSummaryPipeline: async (input) => {
        calls.push(`pipeline:${input.sessionID}`)
        return {
          status: "summarized" as const,
          requestAnchorID: "req_1",
          summaryID: "sum_1",
          checkpointObservationAt: 2,
        }
      },
    })

    const result = await worker.completeSession("ses_demo")

    expect(result).toEqual({
      status: "completed",
      sessionID: "ses_demo",
      summaryStatus: "summarized",
      requestAnchorID: "req_1",
      summaryID: "sum_1",
      checkpointObservationAt: 2,
    })
    expect(calls).toEqual(["guard:ses_demo", "pipeline:ses_demo"])
  })

  test("selects injection records through the worker service", () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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

  test("builds system context inside the worker service", () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
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
      buildSystemMemoryContext() {
        calls.push("build")
        return ["[MEMORY]", "Recent summaries:"]
      },
    })

    const result = worker.buildSystemContext({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })

    expect(result).toEqual(["[MEMORY]", "Recent summaries:"])
    expect(calls).toEqual(["select", "build"])
  })

  test("builds compaction context inside the worker service", () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
      projectPath: "/workspace/demo",
      store: {} as MemoryIdleSummaryStore & MemoryInjectionStore,
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      selectInjectionRecords() {
        calls.push("select")
        return {
          scope: "project",
          summaries: [],
          observations: [],
        }
      },
      buildCompactionMemoryContext() {
        calls.push("build")
        return ["[MEMORY CHECKPOINTS]", "Recent memory summaries:"]
      },
    })

    const result = worker.buildCompactionContext({
      sessionID: "ses_demo",
      maxSummaries: 2,
      maxObservations: 3,
      maxChars: 1000,
    })

    expect(result).toEqual(["[MEMORY CHECKPOINTS]", "Recent memory summaries:"])
    expect(calls).toEqual(["select", "build"])
  })

  test("falls back from session search to project search inside the worker", () => {
    const calls: Array<{ sessionID?: string; scope?: "session" | "project" }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords(input) {
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
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline() {
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
    })

    const result = worker.searchMemoryRecords({
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

  test("merges semantic and text results within the session scope before project fallback", async () => {
    const semanticCalls: Array<{ sessionID?: string }> = []
    const textCalls: Array<{ sessionID?: string }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords(input) {
          textCalls.push({ sessionID: input.sessionID })
          if (input.sessionID) {
            return [
              {
                kind: "summary" as const,
                id: "sum_session_text",
                content: "文本命中的 session summary",
                createdAt: 2,
              },
            ]
          }

          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline() {
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        semanticCalls.push({ sessionID: input.sessionID })
        if (input.sessionID) {
          return [
            {
              kind: "observation" as const,
              id: "obs_session_semantic",
              content: "语义命中的 session observation",
              createdAt: 1,
              tool: "read",
              importance: 0.8,
              tags: ["session"],
            },
          ]
        }

        return []
      },
    })

    const result = await worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "跨多次 run 复用后台进程",
      limit: 5,
    })

    expect(semanticCalls).toEqual([{ sessionID: "ses_demo" }])
    expect(textCalls).toEqual([{ sessionID: "ses_demo" }])
    expect(result.scope).toBe("session")
    expect(result.results.map((record) => record.id)).toEqual([
      "sum_session_text",
      "obs_session_semantic",
    ])
  })

  test("falls back to project scope with merged semantic and text results when session scope is empty", async () => {
    const semanticCalls: Array<{ sessionID?: string }> = []
    const textCalls: Array<{ sessionID?: string }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords(input) {
          textCalls.push({ sessionID: input.sessionID })
          if (!input.sessionID) {
            return [
              {
                kind: "summary" as const,
                id: "sum_project_text",
                content: "文本命中的 project summary",
                createdAt: 2,
              },
            ]
          }
          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline() {
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        semanticCalls.push({ sessionID: input.sessionID })
        if (input.sessionID) {
          return []
        }

        return [
          {
            kind: "observation" as const,
            id: "obs_project_semantic",
            content: "语义命中的 project observation",
            createdAt: 1,
            tool: "bash",
            importance: 0.9,
            tags: ["project"],
          },
        ]
      },
    })

    const result = await worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "跨多次 run 复用后台进程",
      limit: 5,
    })

    expect(semanticCalls).toEqual([{ sessionID: "ses_demo" }, { sessionID: undefined }])
    expect(textCalls).toEqual([{ sessionID: "ses_demo" }, { sessionID: undefined }])
    expect(result.scope).toBe("project")
    expect(result.results.map((record) => record.id)).toEqual([
      "sum_project_text",
      "obs_project_semantic",
    ])
  })

  test("deduplicates records across semantic and text hits while keeping summary-first ordering", async () => {
    const worker = createMemoryWorkerService({
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
        searchMemoryRecords(input) {
          if (!input.sessionID) {
            return []
          }

          return [
            {
              kind: "summary" as const,
              id: "sum_dup",
              content: "文本与语义都命中的 summary",
              createdAt: 3,
            },
            {
              kind: "observation" as const,
              id: "obs_dup",
              content: "文本与语义都命中的 observation",
              createdAt: 2,
              tool: "read",
              importance: 0.8,
              tags: ["dup"],
            },
            {
              kind: "observation" as const,
              id: "obs_text_only",
              content: "仅文本命中的 observation",
              createdAt: 1,
              tool: "grep",
              importance: 0.7,
              tags: ["text"],
            },
          ]
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline() {
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        if (!input.sessionID) {
          return []
        }

        return [
          {
            kind: "summary" as const,
            id: "sum_dup",
            content: "文本与语义都命中的 summary",
            createdAt: 3,
          },
          {
            kind: "observation" as const,
            id: "obs_dup",
            content: "文本与语义都命中的 observation",
            createdAt: 2,
            tool: "read",
            importance: 0.8,
            tags: ["dup"],
          },
        ]
      },
    })

    const result = await worker.searchMemoryRecords({
      sessionID: "ses_demo",
      query: "dup",
      limit: 5,
      scope: "session",
    })

    expect(result.results.map((record) => `${record.kind}:${record.id}`)).toEqual([
      "summary:sum_dup",
      "observation:obs_dup",
      "observation:obs_text_only",
    ])
  })

  test("prefers semantic observation anchors before text timeline fallback", async () => {
    const semanticCalls: Array<{ sessionID?: string; kinds?: string[] }> = []
    const timelineCalls: Array<{
      sessionID?: string
      anchorID?: string
      query?: string
    }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords() {
          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline(input) {
          timelineCalls.push({
            sessionID: input.sessionID,
            anchorID: input.anchorID,
            query: input.query,
          })
          if (input.anchorID === "obs_project_semantic") {
            return {
              anchor: {
                kind: "observation" as const,
                id: "obs_project_semantic",
                content: "修复 worker 复用时的端口竞争",
                createdAt: 2,
                tool: "bash",
                importance: 0.9,
                tags: ["worker"],
                evidence: {},
                isAnchor: true,
              },
              items: [],
            }
          }
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        semanticCalls.push({
          sessionID: input.sessionID,
          kinds: input.kinds,
        })

        if (input.sessionID) {
          return []
        }

        return [
          {
            kind: "observation" as const,
            id: "obs_project_semantic",
            content: "修复 worker 复用时的端口竞争",
            createdAt: 2,
            tool: "bash",
            importance: 0.9,
            tags: ["worker"],
          },
        ]
      },
    })

    const result = await worker.getMemoryTimeline({
      sessionID: "ses_demo",
      query: "解决后台监听占用问题",
      depthBefore: 2,
      depthAfter: 2,
    })

    expect(semanticCalls).toEqual([
      { sessionID: "ses_demo", kinds: ["observation"] },
      { sessionID: undefined, kinds: ["observation"] },
    ])
    expect(timelineCalls).toEqual([
      {
        sessionID: "ses_demo",
        anchorID: undefined,
        query: "解决后台监听占用问题",
      },
      {
        sessionID: undefined,
        anchorID: "obs_project_semantic",
        query: undefined,
      },
    ])
    expect(result?.scope).toBe("project")
    expect(result?.timeline.anchor.id).toBe("obs_project_semantic")
  })

  test("falls back to text timeline query when semantic observation search does not hit", async () => {
    const semanticCalls: Array<{ sessionID?: string; kinds?: string[] }> = []
    const timelineCalls: Array<{
      sessionID?: string
      anchorID?: string
      query?: string
    }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords() {
          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline(input) {
          timelineCalls.push({
            sessionID: input.sessionID,
            anchorID: input.anchorID,
            query: input.query,
          })
          if (input.sessionID && input.query === "requirements") {
            return {
              anchor: {
                kind: "summary" as const,
                id: "sum_session_text",
                content: "读取 requirements 并确认缺材料",
                createdAt: 3,
                requestSummary: "梳理 requirements",
                isAnchor: true,
              },
              items: [],
            }
          }
          return null
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        semanticCalls.push({
          sessionID: input.sessionID,
          kinds: input.kinds,
        })
        return []
      },
    })

    const result = await worker.getMemoryTimeline({
      sessionID: "ses_demo",
      query: "requirements",
      depthBefore: 2,
      depthAfter: 2,
    })

    expect(semanticCalls).toEqual([{ sessionID: "ses_demo", kinds: ["observation"] }])
    expect(timelineCalls).toEqual([
      {
        sessionID: "ses_demo",
        anchorID: undefined,
        query: "requirements",
      },
    ])
    expect(result?.scope).toBe("session")
    expect(result?.timeline.anchor.id).toBe("sum_session_text")
  })

  test("keeps explicit anchor resolution ahead of semantic timeline query", async () => {
    const semanticCalls: Array<{ sessionID?: string; kinds?: string[] }> = []
    const timelineCalls: Array<{
      sessionID?: string
      anchorID?: string
      query?: string
    }> = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords() {
          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline(input) {
          timelineCalls.push({
            sessionID: input.sessionID,
            anchorID: input.anchorID,
            query: input.query,
          })
          return {
            anchor: {
              kind: "observation" as const,
              id: input.anchorID ?? "obs_fallback",
              content: "显式 anchor",
              createdAt: 1,
              tool: "read",
              importance: 0.8,
              tags: [],
              evidence: {},
              isAnchor: true,
            },
            items: [],
          }
        },
        getQueueStats() {
          return { pending: 0, processing: 0, failed: 0 }
        },
        listFailedJobs() {
          return []
        },
        retryJob() {
          return false
        },
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
      searchSemanticMemoryRecords: async (input) => {
        semanticCalls.push({
          sessionID: input.sessionID,
          kinds: input.kinds,
        })
        return []
      },
    })

    const result = await worker.getMemoryTimeline({
      sessionID: "ses_demo",
      anchorID: "obs_explicit",
      query: "should not matter",
      depthBefore: 2,
      depthAfter: 2,
    })

    expect(semanticCalls).toEqual([])
    expect(timelineCalls).toEqual([
      {
        sessionID: "ses_demo",
        anchorID: "obs_explicit",
        query: "should not matter",
      },
    ])
    expect(result?.scope).toBe("session")
    expect(result?.timeline.anchor.id).toBe("obs_explicit")
  })

  test("reads queue status and retries failed jobs through the worker service", async () => {
    const calls: string[] = []

    const worker = createMemoryWorkerService({
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
        searchMemoryRecords() {
          return []
        },
        getMemoryDetails() {
          return []
        },
        getMemoryTimeline() {
          return null
        },
        getQueueStats() {
          calls.push("stats")
          return { pending: 1, processing: 0, failed: 1 }
        },
        listProcessingJobs(limit) {
          calls.push(`processing:${limit}`)
          return []
        },
        listFailedJobs(limit) {
          calls.push(`failed:${limit}`)
          return [
            {
              id: 7,
              sessionID: "ses_demo",
              kind: "request-anchor" as const,
              attemptCount: 3,
              lastError: "persistent failure",
              updatedAt: 123,
            },
          ]
        },
        retryJob(id) {
          calls.push(`retry:${id}`)
          return true
        },
      },
      readWorkerStatus() {
        calls.push("worker-status")
        return {
          updatedAt: 456,
          isProcessing: true,
          queueDepth: 1,
          counts: { pending: 1, processing: 0, failed: 1 },
          lastEvent: {
            type: "enqueue",
            sessionID: "ses_demo",
            jobID: 7,
            kind: "request-anchor",
          },
        }
      },
      idleSummaryGuard: {
        async run(_sessionID, task) {
          await task()
          return { ran: true }
        },
      },
    })

    expect(worker.getQueueStatus({ limit: 5 })).toEqual({
      isProcessing: true,
      queueDepth: 1,
      counts: { pending: 1, processing: 0, failed: 1 },
      workerStatus: {
        updatedAt: 456,
        isProcessing: true,
        queueDepth: 1,
        counts: { pending: 1, processing: 0, failed: 1 },
        activeSessionIDs: [],
        lastEvent: {
          type: "enqueue",
          sessionID: "ses_demo",
          jobID: 7,
          kind: "request-anchor",
        },
      },
      processingJobs: [],
      failedJobs: [
        {
          id: 7,
          sessionID: "ses_demo",
          kind: "request-anchor",
          attemptCount: 3,
          lastError: "persistent failure",
          updatedAt: 123,
        },
      ],
    })

    expect(worker.retryQueueJob(7)).toEqual({ retried: true, jobID: 7 })
    expect(calls).toEqual(["stats", "worker-status", "processing:5", "failed:5", "retry:7"])
  })
})
