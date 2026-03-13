import type { Plugin } from "@opencode-ai/plugin"
import { captureToolObservation } from "./runtime/hooks/tool-after.js"
import { buildSystemContinuityContext } from "./runtime/injection/system-context.js"
import { memorySearchTool } from "./tools/memory-search.js"
import { memoryDetailsTool } from "./tools/memory-details.js"
import { log } from "./services/logger.js"

export const OpenCodeContinuityPlugin: Plugin = async () => {
  const recentObservations: ReturnType<typeof captureToolObservation>[] = []

  return {
    "chat.message": async () => {
      // Reserved for request anchoring in later iterations.
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        log("session.idle", { sessionID: event.properties?.sessionID })
      }
    },

    "tool.execute.after": async (input, output) => {
      const observation = captureToolObservation(input, output)
      if (!observation) return

      recentObservations.unshift(observation)
      if (recentObservations.length > 20) recentObservations.pop()
      log("captured observation", { id: observation.id, tool: observation.tool.name })
    },

    "experimental.chat.system.transform": async (_input, output) => {
      const system = buildSystemContinuityContext({
        summaries: [],
        observations: recentObservations.filter(Boolean).slice(0, 5) as NonNullable<
          ReturnType<typeof captureToolObservation>
        >[],
      })

      if (system.length > 0) {
        output.system.unshift(...system)
      }
    },

    tool: {
      memory_search: memorySearchTool,
      memory_details: memoryDetailsTool,
    },
  }
}

export default OpenCodeContinuityPlugin
