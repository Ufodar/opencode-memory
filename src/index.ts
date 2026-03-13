import type { Plugin } from "@opencode-ai/plugin"
import { getDefaultDatabasePath } from "./config/paths.js"
import { captureToolObservation } from "./runtime/hooks/tool-after.js"
import { buildSystemContinuityContext } from "./runtime/injection/system-context.js"
import { ContinuityStore } from "./storage/sqlite/continuity-store.js"
import { createMemorySearchTool } from "./tools/memory-search.js"
import { createMemoryDetailsTool } from "./tools/memory-details.js"
import { log } from "./services/logger.js"

export const OpenCodeContinuityPlugin: Plugin = async ({ directory }) => {
  const store = new ContinuityStore(getDefaultDatabasePath())

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
      const observation = captureToolObservation(
        {
          ...input,
          projectPath: directory,
        },
        output,
      )
      if (!observation) return

      store.saveObservation(observation)
      log("captured observation", { id: observation.id, tool: observation.tool.name })
    },

    "experimental.chat.system.transform": async (input, output) => {
      const observations = store.listRecentObservations({
        projectPath: directory,
        sessionID: input.sessionID,
        limit: 5,
      })

      const system = buildSystemContinuityContext({
        summaries: [],
        observations,
      })

      if (system.length > 0) {
        output.system.unshift(...system)
      }
    },

    tool: {
      memory_search: createMemorySearchTool(store, directory),
      memory_details: createMemoryDetailsTool(store),
    },
  }
}

export default OpenCodeContinuityPlugin
