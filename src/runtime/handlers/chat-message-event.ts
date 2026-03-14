import type { RequestAnchorRecord } from "../../memory/request/types.js"
import { captureRequestAnchor as defaultCaptureRequestAnchor } from "../hooks/chat-message.js"

type CaptureRequestAnchor = typeof defaultCaptureRequestAnchor

export interface ChatMessageHandlerDependencies {
  projectPath: string
  saveRequestAnchor(record: RequestAnchorRecord): void
  captureRequestAnchor?: CaptureRequestAnchor
}

export function createChatMessageHandler(input: ChatMessageHandlerDependencies) {
  const captureRequestAnchor = input.captureRequestAnchor ?? defaultCaptureRequestAnchor

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

    const requestAnchor = captureRequestAnchor({
      sessionID: messageInput.sessionID,
      messageID: output.message.id,
      projectPath: input.projectPath,
      text,
    })

    if (!requestAnchor) {
      return
    }

    input.saveRequestAnchor(requestAnchor)
  }
}
