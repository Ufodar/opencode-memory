import { tool } from "@opencode-ai/plugin"
import type { ContinuityWorkerService } from "../services/continuity-worker-service.js"

export function createMemorySearchTool(worker: Pick<ContinuityWorkerService, "searchContinuityRecords">) {
  return tool({
    description:
      "Search continuity memory by keywords or technical tags. If scope is omitted, search current session first and fall back to project history.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
    },
    async execute(args, toolCtx) {
      const limit = args.limit ?? 10
      const result = worker.searchContinuityRecords({
        sessionID: toolCtx.sessionID,
        query: args.query,
        limit,
        scope: args.scope,
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
