import { tool } from "@opencode-ai/plugin"
import type { MemoryWorkerService } from "../services/memory-worker-service.js"

export function createMemoryContextPreviewTool(
  worker: Pick<MemoryWorkerService, "buildSystemContext">,
  input?: {
    readPriorAssistantMessage?: (sessionID?: string) => Promise<string | undefined>
  },
) {
  return tool({
    description:
      "Preview the memory context that opencode-memory would inject into the current session right now. Use this to inspect recent summaries and unsummarized observations before debugging retrieval or injection behavior.",
    args: {
      maxSummaries: tool.schema.number().optional(),
      maxObservations: tool.schema.number().optional(),
      maxChars: tool.schema.number().optional(),
    },
    async execute(args, toolCtx) {
      const priorAssistantMessage = await input?.readPriorAssistantMessage?.(toolCtx.sessionID)
      const lines = await worker.buildSystemContext({
        sessionID: toolCtx.sessionID,
        maxSummaries: args.maxSummaries ?? 3,
        maxObservations: args.maxObservations ?? 5,
        maxChars: args.maxChars ?? 2_000,
        priorAssistantMessage,
      })

      return JSON.stringify({
        success: true,
        lineCount: lines.length,
        lines,
      })
    },
  })
}
