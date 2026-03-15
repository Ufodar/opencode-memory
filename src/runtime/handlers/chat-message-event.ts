import type { ContinuityWorkerService } from "../../services/continuity-worker-service.js"

export interface ChatMessageHandlerDependencies {
  worker: Pick<ContinuityWorkerService, "captureRequestAnchorFromMessage">
}

export function createChatMessageHandler(input: ChatMessageHandlerDependencies) {
  return async (
    messageInput: { sessionID: string },
    output: {
      message: { id?: string }
      parts: Array<{ type: string; text?: string }>
    },
  ) => {
    const text = output.parts
      .filter((part): part is typeof part & { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n")

    input.worker.captureRequestAnchorFromMessage({
      sessionID: messageInput.sessionID,
      messageID: output.message.id,
      text,
    })
  }
}
