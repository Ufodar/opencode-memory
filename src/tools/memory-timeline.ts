import { tool } from "@opencode-ai/plugin"
import type { ContinuityStore } from "../storage/sqlite/continuity-store.js"

const DEFAULT_DEPTH_BEFORE = 3
const DEFAULT_DEPTH_AFTER = 3

export function createMemoryTimelineTool(store: ContinuityStore, projectPath: string) {
  return tool({
    description:
      "Show chronological continuity context around a summary or observation anchor. Prefer this after memory_search and before memory_details. If scope is omitted, resolve the timeline from current session first and then fall back to project history.",
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

      const depthBefore = args.depth_before ?? DEFAULT_DEPTH_BEFORE
      const depthAfter = args.depth_after ?? DEFAULT_DEPTH_AFTER

      let scopeUsed: "session" | "project" = "project"
      let timeline =
        args.scope === "project"
          ? store.getContinuityTimeline({
              projectPath,
              anchorID: args.anchor,
              query: args.query,
              depthBefore,
              depthAfter,
            })
          : store.getContinuityTimeline({
              projectPath,
              sessionID: toolCtx.sessionID,
              anchorID: args.anchor,
              query: args.query,
              depthBefore,
              depthAfter,
            })

      if (args.scope === "project") {
        scopeUsed = "project"
      } else if (timeline || args.scope === "session") {
        scopeUsed = "session"
      } else {
        timeline = store.getContinuityTimeline({
          projectPath,
          anchorID: args.anchor,
          query: args.query,
          depthBefore,
          depthAfter,
        })
        scopeUsed = "project"
      }

      if (!timeline) {
        return JSON.stringify({
          success: false,
          error: "No continuity timeline found for the provided anchor or query",
        })
      }

      return JSON.stringify({
        success: true,
        scope: scopeUsed,
        anchor: timeline.anchor,
        count: timeline.items.length,
        items: timeline.items,
      })
    },
  })
}
