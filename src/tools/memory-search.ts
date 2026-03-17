import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

const OBSERVATION_PHASES = [
  "planning",
  "research",
  "execution",
  "verification",
  "decision",
  "other",
] as const

export function createMemorySearchTool(worker: Pick<MemoryWorkerService, "searchMemoryRecords">) {
  return tool({
    description:
      "Search work memory by keywords or technical tags. If scope is omitted, search current session first and fall back to project history.",
    args: {
      query: tool.schema.string(),
      limit: tool.schema.number().optional(),
      scope: tool.schema.enum(["session", "project"]).optional(),
      kind: tool.schema.enum(["summary", "observation"]).optional(),
      phase: tool.schema.enum(OBSERVATION_PHASES).optional(),
    },
    async execute(args, toolCtx) {
      const limit = args.limit ?? 10
      const result = await worker.searchMemoryRecords({
        sessionID: toolCtx.sessionID,
        query: args.query,
        limit,
        scope: args.scope,
        kinds: args.kind ? [args.kind] : undefined,
        phase: args.phase,
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
