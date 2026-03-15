import { tool } from "@opencode-ai/plugin"
import type { ContinuityWorkerService } from "../services/continuity-worker-service.js"

export function createMemoryDetailsTool(worker: Pick<ContinuityWorkerService, "getContinuityDetails">) {
  return tool({
    description: "Fetch detailed continuity records for specific observation or summary IDs.",
    args: {
      ids: tool.schema.array(tool.schema.string()).min(1),
    },
    async execute(args) {
      const results = worker.getContinuityDetails(args.ids)

      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      })
    },
  })
}
