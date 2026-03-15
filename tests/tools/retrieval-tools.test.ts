import { describe, expect, test } from "bun:test"

import type {
  MemorySearchRecord,
  MemoryTimelineItem,
} from "../../src/memory/contracts.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"
import { createMemorySearchTool } from "../../src/tools/memory-search.js"
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
                  kind: "summary",
                  id: "sum_project",
                  content: "project anchor",
                  createdAt: 1,
                  requestSummary: "request",
                  isAnchor: true,
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
              coveredObservations: [],
            },
          ]
        },
      } as Pick<MemoryWorkerService, "getMemoryDetails">,
    )

    const result = JSON.parse(await detailsTool.execute({ ids: ["sum_1"] }, buildToolContext()))

    expect(calls).toEqual([["sum_1"]])
    expect(result.results[0].id).toBe("sum_1")
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
