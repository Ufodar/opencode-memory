import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

export function createMemorySearchTool(worker: Pick<MemoryWorkerService, "searchMemoryRecords">) {
  return tool({
    description:
      "Search work memory by keywords or technical tags. If scope is omitted, search current session first and fall back to project history.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
      kind: tool.schema.enum(["summary", "observation"]).optional(),
    },
    async execute(args, toolCtx) {
      const limit = args.limit ?? 10
      const result = await worker.searchMemoryRecords({
        sessionID: toolCtx.sessionID,
        query: args.query,
        limit,
        scope: args.scope,
        kinds: args.kind ? [args.kind] : undefined,
      })

      return JSON.stringify({
        success: true,
        count: result.results.length,
        scope: result.scope,
        results: result.results,
      })
    },
  })
}
