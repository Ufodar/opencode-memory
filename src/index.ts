import type { Plugin } from "@opencode-ai/plugin"
import { getDefaultDatabasePath } from "./config/paths.js"
import { DEFAULTS } from "./config/defaults.js"
import { createChatMessageHandler } from "./runtime/handlers/chat-message-event.js"
import { registerMemoryFinalFlush } from "./runtime/final-flush.js"
import { createSessionCompactingHandler } from "./runtime/handlers/session-compacting.js"
import { createSessionIdleEventHandler } from "./runtime/handlers/session-idle-event.js"
import { createSystemTransformHandler } from "./runtime/handlers/system-transform.js"
import { createToolExecuteAfterHandler } from "./runtime/handlers/tool-execute-after.js"
import { createMemorySearchTool } from "./tools/memory-search.js"
import { createMemoryDetailsTool } from "./tools/memory-details.js"
import { createMemoryContextPreviewTool } from "./tools/memory-context-preview.js"
import { createMemoryQueueRetryTool } from "./tools/memory-queue-retry.js"
import { createMemoryQueueStatusTool } from "./tools/memory-queue-status.js"
import { createMemoryTimelineTool } from "./tools/memory-timeline.js"
import { startManagedMemoryWorker } from "./worker/manager.js"
import { createReadLastAssistantMessage } from "./runtime/hooks/read-last-assistant-message.js"

export const OpenCodeMemoryPlugin: Plugin = async ({ directory, client }) => {
  const runtime = await startManagedMemoryWorker({
    projectPath: directory,
    databasePath: getDefaultDatabasePath(),
  })
  const worker = runtime.worker
  const readPriorAssistantMessage = createReadLastAssistantMessage({
    client,
  })

  registerMemoryFinalFlush({
    worker,
  })

  const handleChatMessage = createChatMessageHandler({
    worker,
  })
  const handleSessionIdleEvent = createSessionIdleEventHandler({
    worker,
  })
  const handleToolExecuteAfter = createToolExecuteAfterHandler({
    worker,
  })
  const handleSystemTransform = createSystemTransformHandler({
    worker,
    readPriorAssistantMessage,
    maxSummaries: DEFAULTS.maxInjectedSummaries,
    maxObservations: DEFAULTS.maxInjectedObservations,
    maxChars: DEFAULTS.maxInjectedChars,
  })
  const handleSessionCompacting = createSessionCompactingHandler({
    worker,
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
      memory_search: createMemorySearchTool(worker),
      memory_timeline: createMemoryTimelineTool(worker),
      memory_details: createMemoryDetailsTool(worker),
      memory_context_preview: createMemoryContextPreviewTool(worker, {
        readPriorAssistantMessage,
      }),
      memory_queue_status: createMemoryQueueStatusTool(worker),
      memory_queue_retry: createMemoryQueueRetryTool(worker),
    },
  }
}

export default OpenCodeMemoryPlugin
