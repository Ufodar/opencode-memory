import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

export function createMemoryQueueRetryTool(worker: Pick<MemoryWorkerService, "retryQueueJob">) {
  return tool({
    description:
      "Retry a failed memory worker job by id. Use this after memory_queue_status when a failed job should be put back into the pending queue.",
    args: {
      id: tool.schema.number(),
    },
    async execute(args) {
      const result = await worker.retryQueueJob(args.id)

      return JSON.stringify({
        success: true,
        retried: result.retried,
        jobID: result.jobID,
      })
    },
  })
}
