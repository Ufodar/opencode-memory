import { describe, expect, test } from "bun:test"

import type {
  MemorySearchRecord,
  MemoryTimelineItem,
} from "../../src/memory/contracts.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"
import { createMemoryQueueRetryTool } from "../../src/tools/memory-queue-retry.js"
import { createMemoryContextPreviewTool } from "../../src/tools/memory-context-preview.js"
import { createMemorySearchTool } from "../../src/tools/memory-search.js"
import { createMemoryQueueStatusTool } from "../../src/tools/memory-queue-status.js"
import { createMemoryTimelineTool } from "../../src/tools/memory-timeline.js"

describe("retrieval tools", () => {
  test("memory_search delegates query execution to the memory worker", async () => {
    const calls: Array<{ kind: "search"; sessionID?: string; scope?: "session" | "project" }> = []
    const searchTool = createMemorySearchTool(
      {
        searchMemoryRecords(input) {
          calls.push({ kind: "search", sessionID: input.sessionID, scope: input.scope })
          return {
            scope: "session",
            results: [
              {
                kind: "summary",
                id: "sum_project",
                content: "project result",
                createdAt: 1,
              },
            ] satisfies MemorySearchRecord[],
          }
        },
      } as Pick<MemoryWorkerService, "searchMemoryRecords">,
    )

    const result = JSON.parse(
      await searchTool.execute(
        { query: "requirements", limit: 5 },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      { kind: "search", sessionID: "ses_current", scope: undefined },
    ])
    expect(result.scope).toBe("session")
    expect(result.results[0].id).toBe("sum_project")
  })

  test("memory_search forwards kind filter to the memory worker", async () => {
    const calls: Array<{
      kind: "search"
      sessionID?: string
      scope?: "session" | "project"
      kinds?: string[]
    }> = []
    const searchTool = createMemorySearchTool(
      {
        searchMemoryRecords(input: any) {
          calls.push({
            kind: "search",
            sessionID: input.sessionID,
            scope: input.scope,
            kinds: input.kinds,
          })
          return {
            scope: "session",
            results: [
              {
                kind: "summary",
                id: "sum_only",
                content: "summary result",
                createdAt: 1,
              },
            ] satisfies MemorySearchRecord[],
          }
        },
      } as Pick<MemoryWorkerService, "searchMemoryRecords">,
    )

    const result = JSON.parse(
      await searchTool.execute(
        { query: "requirements", kind: "summary", limit: 5 },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      {
        kind: "search",
        sessionID: "ses_current",
        scope: undefined,
        kinds: ["summary"],
      },
    ])
    expect(result.results[0].id).toBe("sum_only")
  })

  test("memory_search forwards phase filter to the memory worker", async () => {
    const calls: Array<{
      kind: "search"
      sessionID?: string
      phase?: string
    }> = []
    const searchTool = createMemorySearchTool(
      {
        searchMemoryRecords(input: any) {
          calls.push({
            kind: "search",
            sessionID: input.sessionID,
            phase: input.phase,
          })
          return {
            scope: "session",
            results: [
              {
                kind: "observation",
                id: "obs_decision",
                content: "decision result",
                createdAt: 1,
                tool: "read",
                importance: 0.9,
                tags: ["decision"],
                phase: "decision",
              },
            ] satisfies MemorySearchRecord[],
          }
        },
      } as Pick<MemoryWorkerService, "searchMemoryRecords">,
    )

    const result = JSON.parse(
      await searchTool.execute(
        { query: "requirements", phase: "decision", limit: 5 },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      {
        kind: "search",
        sessionID: "ses_current",
        phase: "decision",
      },
    ])
    expect(result.results[0].id).toBe("obs_decision")
  })

  test("memory_timeline delegates timeline resolution to the memory worker", async () => {
    const calls: Array<{ kind: "timeline"; sessionID?: string; scope?: "session" | "project" }> = []
    const timelineTool = createMemoryTimelineTool(
      {
        getMemoryTimeline(input) {
          calls.push({ kind: "timeline", sessionID: input.sessionID, scope: input.scope })
          return {
            scope: "session",
            timeline: {
              anchor: {
                kind: "summary",
                id: "sum_project",
                content: "project anchor",
                createdAt: 1,
                requestSummary: "request",
                isAnchor: true,
              } satisfies MemoryTimelineItem,
              items: [
                {
                  kind: "observation",
                  id: "obs_project",
                  content: "读取 requirements.md 并确认缺少业绩证明",
                  createdAt: 2,
                  tool: "read",
                  importance: 0.9,
                  tags: ["requirements"],
                  evidence: {
                    workingDirectory: "/workspace/demo",
                    filesRead: ["/workspace/demo/requirements.md"],
                  },
                  isAnchor: false,
                } satisfies MemoryTimelineItem,
              ],
            },
          }
        },
      } as Pick<MemoryWorkerService, "getMemoryTimeline">,
    )

    const result = JSON.parse(await timelineTool.execute({ query: "requirements" }, buildToolContext()))

    expect(calls).toEqual([{ kind: "timeline", sessionID: "ses_current", scope: undefined }])
    expect(result.scope).toBe("session")
    expect(result.anchor.id).toBe("sum_project")
    expect(result.items[0].evidence.filesRead).toEqual(["/workspace/demo/requirements.md"])
  })
})

describe("memory_details", () => {
  test("delegates detail lookup to the memory worker", async () => {
    const calls: string[][] = []
    const { createMemoryDetailsTool } = await import("../../src/tools/memory-details.js")

    const detailsTool = createMemoryDetailsTool(
      {
        getMemoryDetails(ids) {
          calls.push(ids)
          return [
            {
              kind: "summary",
              id: "sum_1",
              content: "summary",
              createdAt: 1,
              requestSummary: "request",
              observationIDs: [],
              coveredObservations: [
                {
                  kind: "observation",
                  id: "obs_covered",
                  content: "读取 brief.txt 并形成缺口判断",
                  createdAt: 2,
                  tool: "read",
                  importance: 0.9,
                  tags: ["observation"],
                  inputSummary: "读取 brief.txt",
                  outputSummary: "发现业绩证明缺口",
                  trace: {
                    workingDirectory: "/workspace/demo",
                    filePaths: ["/workspace/demo/brief.txt"],
                    filesRead: ["/workspace/demo/brief.txt"],
                  },
                },
              ],
            },
            {
              kind: "observation",
              id: "obs_1",
              content: "执行缺口检查",
              createdAt: 3,
              tool: "bash",
              importance: 0.8,
              tags: ["observation"],
              inputSummary: "运行缺口检查脚本",
              outputSummary: "已生成缺口清单",
              trace: {
                workingDirectory: "/workspace/demo",
                command: "python scripts/check_gap.py",
              },
            },
          ]
        },
      } as Pick<MemoryWorkerService, "getMemoryDetails">,
    )

    const result = JSON.parse(await detailsTool.execute({ ids: ["sum_1"] }, buildToolContext()))

    expect(calls).toEqual([["sum_1"]])
    expect(result.results[0].id).toBe("sum_1")
    expect(result.results[0].coveredObservations[0].trace.filesRead).toEqual([
      "/workspace/demo/brief.txt",
    ])
    expect(result.results[1].trace.command).toBe("python scripts/check_gap.py")
  })
})

describe("memory_context_preview", () => {
  test("delegates injected-context preview to the memory worker", async () => {
    const calls: Array<{
      sessionID?: string
      maxSummaries: number
      maxObservations: number
      maxChars: number
      priorAssistantMessage?: string
    }> = []

    const previewTool = createMemoryContextPreviewTool(
      {
        buildSystemContext(input) {
          calls.push(input)
          return [
            "[CONTINUITY]",
            "[MEMORY SUMMARY]",
            "- summary 1",
            "[MEMORY TIMELINE]",
            "- observation 1 (files: requirements.csv)",
            "[RESUME GUIDE]",
            "- continue from summary 1",
            "[PREVIOUSLY]",
            "- 已完成 brief.txt 检查，并准备进入 requirements.csv",
          ]
        },
      } as Pick<MemoryWorkerService, "buildSystemContext">,
      {
        async readPriorAssistantMessage(sessionID) {
          expect(sessionID).toBe("ses_current")
          return "已完成 brief.txt 检查，并准备进入 requirements.csv"
        },
      },
    )

    const result = JSON.parse(
      await previewTool.execute(
        {
          maxSummaries: 2,
          maxObservations: 4,
          maxChars: 1200,
        },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      {
        sessionID: "ses_current",
        maxSummaries: 2,
        maxObservations: 4,
        maxChars: 1200,
        priorAssistantMessage: "已完成 brief.txt 检查，并准备进入 requirements.csv",
      },
    ])
    expect(result.lineCount).toBe(9)
    expect(result.lines[0]).toBe("[CONTINUITY]")
    expect(result.lines[1]).toBe("[MEMORY SUMMARY]")
    expect(result.lines[3]).toBe("[MEMORY TIMELINE]")
    expect(result.lines[4]).toContain("files: requirements.csv")
    expect(result.lines[5]).toBe("[RESUME GUIDE]")
    expect(result.lines[7]).toBe("[PREVIOUSLY]")
  })
})

describe("memory queue tools", () => {
  test("memory_queue_status delegates queue inspection to the memory worker", async () => {
    const calls: number[] = []

    const statusTool = createMemoryQueueStatusTool(
      {
        getQueueStatus(input) {
          calls.push(input.limit)
          return {
            isProcessing: true,
            queueDepth: 2,
            counts: { pending: 1, processing: 0, failed: 1 },
            workerStatus: {
              updatedAt: 456,
              isProcessing: true,
              queueDepth: 2,
              counts: { pending: 1, processing: 0, failed: 1 },
              activeSessionIDs: [],
              lastEvent: {
                type: "complete",
                sessionID: "ses_demo",
                jobID: 3,
                kind: "session-idle",
              },
            },
            processingJobs: [
              {
                id: 3,
                sessionID: "ses_demo",
                kind: "session-idle",
                attemptCount: 1,
                startedProcessingAt: 100,
                updatedAt: 123,
                lastError: null,
                isStale: false,
              },
            ],
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
          }
        },
      } as Pick<MemoryWorkerService, "getQueueStatus">,
    )

    const result = JSON.parse(await statusTool.execute({ limit: 5 }, buildToolContext()))

    expect(calls).toEqual([5])
    expect(result.isProcessing).toBe(true)
    expect(result.queueDepth).toBe(2)
    expect(result.workerStatus.lastEvent.type).toBe("complete")
    expect(result.processingJobs[0].id).toBe(3)
    expect(result.counts.failed).toBe(1)
    expect(result.failedJobs[0].id).toBe(7)
  })

  test("memory_queue_retry delegates stuck-job reset to the memory worker", async () => {
    const calls: number[] = []

    const retryTool = createMemoryQueueRetryTool(
      {
        retryQueueJob(jobID) {
          calls.push(jobID)
          return { retried: true, jobID }
        },
      } as Pick<MemoryWorkerService, "retryQueueJob">,
    )

    const result = JSON.parse(await retryTool.execute({ id: 7 }, buildToolContext()))

    expect(calls).toEqual([7])
    expect(result).toEqual({ success: true, retried: true, jobID: 7 })
  })
})

function buildToolContext() {
  return {
    sessionID: "ses_current",
    messageID: "msg_1",
    agent: "general",
    directory: "/workspace/demo",
    worktree: "/workspace/demo",
    abort: new AbortController().signal,
    metadata() {},
    async ask() {},
  }
}
