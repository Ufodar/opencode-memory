import { tool } from "@opencode-ai/plugin"

export const memorySearchTool = tool({
  description: "Search continuity memory by keywords or technical tags.",
  args: {
    query: tool.schema.string(),
    limit: tool.schema.number().optional(),
  },
  async execute(args) {
    return JSON.stringify({
      success: false,
      message: "memory_search is scaffolded but not implemented yet.",
      query: args.query,
      limit: args.limit ?? 10,
    })
  },
})
