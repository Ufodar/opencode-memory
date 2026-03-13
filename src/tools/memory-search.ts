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
      const results = store.searchObservations({
        projectPath,
        query: args.query,
        limit: args.limit ?? 10,
      })

      return JSON.stringify({
        success: true,
        count: results.length,
        results: results.map((item) => ({
          id: item.id,
          content: item.content,
          createdAt: item.createdAt,
          tool: item.tool.name,
          importance: item.retrieval.importance,
          tags: item.retrieval.tags,
        })),
      })
    },
  })
}
