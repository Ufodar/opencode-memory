import { tool } from "@opencode-ai/plugin"
import type { ContinuityStore } from "../storage/sqlite/continuity-store.js"

export function createMemorySearchTool(store: ContinuityStore, projectPath: string) {
  return tool({
    description: "Search continuity memory by keywords or technical tags.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
    },
    async execute(args) {
      const results = store.searchContinuityRecords({
        projectPath,
        query: args.query,
        limit: args.limit ?? 10,
      })

      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      })
    },
  })
}
