import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

const DEFAULT_DEPTH_BEFORE = 3
const DEFAULT_DEPTH_AFTER = 3

export function createMemoryTimelineTool(worker: Pick<MemoryWorkerService, "getMemoryTimeline">) {
  return tool({
    description:
      "Show chronological memory context around a summary or observation anchor. Prefer this after memory_search and before memory_details. If scope is omitted, resolve the timeline from current session first and then fall back to project history.",
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

      const result = await worker.getMemoryTimeline({
        sessionID: toolCtx.sessionID,
        anchorID: args.anchor,
        query: args.query,
        depthBefore,
        depthAfter,
        scope: args.scope,
      })

      if (!result) {
        return JSON.stringify({
          success: false,
          error: "No memory timeline found for the provided anchor or query",
        })
      }

      return JSON.stringify({
        success: true,
        scope: result.scope,
        anchor: result.timeline.anchor,
        count: result.timeline.items.length,
        items: result.timeline.items,
      })
    },
  })
}
