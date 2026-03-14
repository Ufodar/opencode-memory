import { tool } from "@opencode-ai/plugin"
import type { ContinuityDetailsStore } from "../continuity/contracts.js"

export function createMemoryDetailsTool(store: ContinuityDetailsStore) {
  return tool({
    description: "Fetch detailed continuity records for specific observation or summary IDs.",
    args: {
      ids: tool.schema.array(tool.schema.string()).min(1),
    },
    async execute(args) {
      const results = store.getContinuityDetails(args.ids)

      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      })
    },
  })
}
