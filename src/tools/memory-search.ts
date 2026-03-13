import { tool } from "@opencode-ai/plugin"
import type { ContinuityStore } from "../storage/sqlite/continuity-store.js"

export function createMemorySearchTool(store: ContinuityStore, projectPath: string) {
  return tool({
    description: "Search continuity memory by keywords or technical tags.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
    },
    async execute(args, toolCtx) {
      const results = store.searchContinuityRecords({
        projectPath,
        sessionID: args.scope === "session" ? toolCtx.sessionID : undefined,
        query: args.query,
        limit: args.limit ?? 10,
      })

      return JSON.stringify({
        success: true,
        count: results.length,
        scope: args.scope ?? "project",
        results,
      })
    },
  })
}
