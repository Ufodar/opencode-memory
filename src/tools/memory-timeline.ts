import { tool } from "@opencode-ai/plugin"
import type { ContinuityStore } from "../storage/sqlite/continuity-store.js"

const DEFAULT_DEPTH_BEFORE = 3
const DEFAULT_DEPTH_AFTER = 3

export function createMemoryTimelineTool(store: ContinuityStore, projectPath: string) {
  return tool({
    description:
      "Show chronological continuity context around a summary or observation anchor. Prefer this after memory_search and before memory_details.",
    args: {
      anchor: tool.schema.string().optional(),
      query: tool.schema.string().optional(),
      depth_before: tool.schema.number().optional(),
      depth_after: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
    },
    async execute(args, toolCtx) {
      if (!args.anchor && !args.query) {
        return JSON.stringify({
          success: false,
          error: "memory_timeline requires either anchor or query",
        })
      }

      const timeline = store.getContinuityTimeline({
        projectPath,
        sessionID: args.scope === "session" ? toolCtx.sessionID : undefined,
        anchorID: args.anchor,
        query: args.query,
        depthBefore: args.depth_before ?? DEFAULT_DEPTH_BEFORE,
        depthAfter: args.depth_after ?? DEFAULT_DEPTH_AFTER,
      })

      if (!timeline) {
        return JSON.stringify({
          success: false,
          error: "No continuity timeline found for the provided anchor or query",
        })
      }

      return JSON.stringify({
        success: true,
        scope: args.scope ?? "project",
        anchor: timeline.anchor,
        count: timeline.items.length,
        items: timeline.items,
      })
    },
  })
}
