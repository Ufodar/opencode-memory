import { describe, expect, test } from "bun:test"

import { createMemorySearchTool } from "../../src/tools/memory-search.js"
import { createMemoryTimelineTool } from "../../src/tools/memory-timeline.js"
import type { ContinuitySearchRecord, ContinuityStore, ContinuityTimelineItem } from "../../src/storage/sqlite/continuity-store.js"

describe("retrieval tools", () => {
  test("memory_search defaults to session-first and falls back to project", async () => {
    const calls: Array<{ kind: "search"; sessionID?: string }> = []
    const searchTool = createMemorySearchTool(
      {
        searchContinuityRecords(input) {
          calls.push({ kind: "search", sessionID: input.sessionID })
          if (input.sessionID) return []
          return [
            {
              kind: "summary",
              id: "sum_project",
              content: "project result",
              createdAt: 1,
            },
          ] satisfies ContinuitySearchRecord[]
        },
      } as Pick<ContinuityStore, "searchContinuityRecords"> as ContinuityStore,
      "/workspace/demo",
    )

    const result = JSON.parse(
      await searchTool.execute(
        { query: "requirements", limit: 5 },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      { kind: "search", sessionID: "ses_current" },
      { kind: "search", sessionID: undefined },
    ])
    expect(result.scope).toBe("project")
    expect(result.results[0].id).toBe("sum_project")
  })

  test("memory_timeline defaults to session-first and falls back to project", async () => {
    const calls: Array<{ kind: "timeline"; sessionID?: string }> = []
    const timelineTool = createMemoryTimelineTool(
      {
        getContinuityTimeline(input) {
          calls.push({ kind: "timeline", sessionID: input.sessionID })
          if (input.sessionID) return null
          return {
            anchor: {
              kind: "summary",
              id: "sum_project",
              content: "project anchor",
              createdAt: 1,
              requestSummary: "request",
              isAnchor: true,
            } satisfies ContinuityTimelineItem,
            items: [
              {
                kind: "summary",
                id: "sum_project",
                content: "project anchor",
                createdAt: 1,
                requestSummary: "request",
                isAnchor: true,
              } satisfies ContinuityTimelineItem,
            ],
          }
        },
      } as Pick<ContinuityStore, "getContinuityTimeline"> as ContinuityStore,
      "/workspace/demo",
    )

    const result = JSON.parse(
      await timelineTool.execute(
        { query: "requirements" },
        buildToolContext(),
      ),
    )

    expect(calls).toEqual([
      { kind: "timeline", sessionID: "ses_current" },
      { kind: "timeline", sessionID: undefined },
    ])
    expect(result.scope).toBe("project")
    expect(result.anchor.id).toBe("sum_project")
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
