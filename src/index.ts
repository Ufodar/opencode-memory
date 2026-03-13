import type { Plugin } from "@opencode-ai/plugin"
import { getDefaultDatabasePath } from "./config/paths.js"
import { DEFAULTS } from "./config/defaults.js"
import { captureRequestAnchor } from "./runtime/hooks/chat-message.js"
import { captureToolObservation } from "./runtime/hooks/tool-after.js"
import { buildSystemContinuityContext } from "./runtime/injection/system-context.js"
import { selectInjectionRecords } from "./runtime/injection/select-context.js"
import { shouldAggregateRequestWindow, summarizeRequestWindow } from "./memory/summary/aggregate.js"
import { ContinuityStore } from "./storage/sqlite/continuity-store.js"
import { createMemorySearchTool } from "./tools/memory-search.js"
import { createMemoryDetailsTool } from "./tools/memory-details.js"
import { log } from "./services/logger.js"

export const OpenCodeContinuityPlugin: Plugin = async ({ directory }) => {
  const store = new ContinuityStore(getDefaultDatabasePath())

  return {
    "chat.message": async (input, output) => {
      const text = output.parts
        .filter((part): part is typeof part & { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("\n")

      const requestAnchor = captureRequestAnchor({
        sessionID: input.sessionID,
        messageID: output.message.id,
        projectPath: directory,
        text,
      })

      if (!requestAnchor) return

      store.saveRequestAnchor(requestAnchor)
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID
        const requestAnchor = store.getLatestUnsummarizedRequestAnchor({
          projectPath: directory,
          sessionID,
        })

        if (!requestAnchor) {
          log("session.idle without pending request anchor", { sessionID })
          return
        }

        const observations = store.listObservationsForRequestWindow({
          projectPath: directory,
          sessionID,
          afterCreatedAt: requestAnchor.createdAt,
        })

        if (!shouldAggregateRequestWindow({ observations })) {
          log("session.idle without aggregatable observations", {
            sessionID,
            requestAnchorID: requestAnchor.id,
          })
          return
        }

        const summary = summarizeRequestWindow({
          request: requestAnchor,
          observations,
        })

        store.saveSummary(summary)
        store.markRequestAnchorSummarized(requestAnchor.id, Date.now())
        log("captured summary", { id: summary.id, sessionID })
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
      const selected = selectInjectionRecords({
        store,
        projectPath: directory,
        sessionID: input.sessionID,
        maxSummaries: DEFAULTS.maxInjectedSummaries,
        maxObservations: DEFAULTS.maxInjectedObservations,
      })

      const system = buildSystemContinuityContext({
        summaries: selected.summaries,
        observations: selected.observations,
        maxSummaries: DEFAULTS.maxInjectedSummaries,
        maxObservations: DEFAULTS.maxInjectedObservations,
        maxChars: DEFAULTS.maxInjectedChars,
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
