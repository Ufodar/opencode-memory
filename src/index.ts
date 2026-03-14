import type { Plugin } from "@opencode-ai/plugin"
import { getDefaultDatabasePath } from "./config/paths.js"
import { DEFAULTS } from "./config/defaults.js"
import { createSessionReentryGuard } from "./runtime/hooks/idle-summary-guard.js"
import { createChatMessageHandler } from "./runtime/handlers/chat-message-event.js"
import { createSessionCompactingHandler } from "./runtime/handlers/session-compacting.js"
import { createSessionIdleEventHandler } from "./runtime/handlers/session-idle-event.js"
import { createSystemTransformHandler } from "./runtime/handlers/system-transform.js"
import { createToolExecuteAfterHandler } from "./runtime/handlers/tool-execute-after.js"
import { generateModelSummary } from "./services/ai/model-summary.js"
import { SQLiteContinuityStore } from "./storage/sqlite/continuity-store.js"
import { createMemorySearchTool } from "./tools/memory-search.js"
import { createMemoryDetailsTool } from "./tools/memory-details.js"
import { createMemoryTimelineTool } from "./tools/memory-timeline.js"

export const OpenCodeContinuityPlugin: Plugin = async ({ directory }) => {
  const store = new SQLiteContinuityStore(getDefaultDatabasePath())
  const idleSummaryGuard = createSessionReentryGuard()
  const handleChatMessage = createChatMessageHandler({
    projectPath: directory,
    saveRequestAnchor: (record) => store.saveRequestAnchor(record),
  })
  const handleSessionIdleEvent = createSessionIdleEventHandler({
    projectPath: directory,
    store,
    idleSummaryGuard,
    generateModelSummary,
  })
  const handleToolExecuteAfter = createToolExecuteAfterHandler({
    projectPath: directory,
    saveObservation: (record) => store.saveObservation(record),
  })
  const handleSystemTransform = createSystemTransformHandler({
    store,
    projectPath: directory,
    maxSummaries: DEFAULTS.maxInjectedSummaries,
    maxObservations: DEFAULTS.maxInjectedObservations,
    maxChars: DEFAULTS.maxInjectedChars,
  })
  const handleSessionCompacting = createSessionCompactingHandler({
    store,
    projectPath: directory,
    maxSummaries: DEFAULTS.maxCompactionSummaries,
    maxObservations: DEFAULTS.maxCompactionObservations,
    maxChars: DEFAULTS.maxCompactionChars,
  })

  return {
    "chat.message": handleChatMessage,

    event: handleSessionIdleEvent,

    "tool.execute.after": handleToolExecuteAfter,

    "experimental.chat.system.transform": handleSystemTransform,

    "experimental.session.compacting": handleSessionCompacting,

    tool: {
      memory_search: createMemorySearchTool(store, directory),
      memory_timeline: createMemoryTimelineTool(store, directory),
      memory_details: createMemoryDetailsTool(store),
    },
  }
}

export default OpenCodeContinuityPlugin
