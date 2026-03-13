import { tool } from "@opencode-ai/plugin"
import type { ContinuityStore } from "../storage/sqlite/continuity-store.js"

export function createMemoryDetailsTool(store: ContinuityStore) {
  return tool({
    description: "Fetch detailed continuity records for specific observation or summary IDs.",
    args: {
      ids: tool.schema.array(tool.schema.string()).min(1),
    },
    async execute(args) {
      const results = store.getObservationsByIds(args.ids)

      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      })
    },
  })
}
