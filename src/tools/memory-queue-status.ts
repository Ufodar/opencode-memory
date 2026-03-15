import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

export function createMemoryQueueStatusTool(worker: Pick<MemoryWorkerService, "getQueueStatus">) {
  return tool({
    description:
      "Show current memory worker queue depth, active processing jobs, and the most recent failed jobs. Use this when memory capture or summary seems stuck or silently failing.",
    args: {
      limit: tool.schema.number().optional(),
    },
    async execute(args) {
      const result = await worker.getQueueStatus({
        limit: args.limit ?? 10,
      })

      return JSON.stringify({
        success: true,
        isProcessing: result.isProcessing,
        queueDepth: result.queueDepth,
        counts: result.counts,
        processingJobs: result.processingJobs,
        failedJobs: result.failedJobs,
      })
    },
  })
}
