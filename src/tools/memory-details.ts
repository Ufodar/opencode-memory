import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

export function createMemoryDetailsTool(worker: Pick<MemoryWorkerService, "getMemoryDetails">) {
  return tool({
    description: "Fetch detailed memory records for specific observation or summary IDs.",
    args: {
      ids: tool.schema.array(tool.schema.string()).min(1),
    },
    async execute(args) {
      const results = await worker.getMemoryDetails(args.ids)

      return JSON.stringify({
        success: true,
        count: results.length,
        results,
      })
    },
  })
}
