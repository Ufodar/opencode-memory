import { tool } from "@opencode-ai/plugin"

export const memoryDetailsTool = tool({
  description: "Fetch detailed continuity records for specific observation or summary IDs.",
  args: {
    ids: tool.schema.array(tool.schema.string()).min(1),
  },
  async execute(args) {
    return JSON.stringify({
      success: false,
      message: "memory_details is scaffolded but not implemented yet.",
      ids: args.ids,
    })
  },
})
