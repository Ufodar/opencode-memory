import { tool } from "@opencode-ai/plugin"
import type { ContinuitySearchStore } from "../continuity/contracts.js"

export function createMemorySearchTool(store: ContinuitySearchStore, projectPath: string) {
  return tool({
    description:
      "Search continuity memory by keywords or technical tags. If scope is omitted, search current session first and fall back to project history.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
    },
    async execute(args, toolCtx) {
      const limit = args.limit ?? 10

      let scopeUsed: "session" | "project" = "project"
      let results =
        args.scope === "project"
          ? store.searchContinuityRecords({
              projectPath,
              query: args.query,
              limit,
            })
          : store.searchContinuityRecords({
              projectPath,
              sessionID: toolCtx.sessionID,
              query: args.query,
              limit,
            })

      if (args.scope === "project") {
        scopeUsed = "project"
      } else if (results.length > 0 || args.scope === "session") {
        scopeUsed = "session"
      } else {
        results = store.searchContinuityRecords({
          projectPath,
          query: args.query,
          limit,
        })
        scopeUsed = "project"
      }

      return JSON.stringify({
        success: true,
        count: results.length,
        scope: scopeUsed,
        results,
      })
    },
  })
}
