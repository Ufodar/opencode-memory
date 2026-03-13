import type { RequestAnchorRecord } from "../../memory/request/types.js"

export function captureRequestAnchor(input: {
  sessionID: string
  messageID?: string
  projectPath: string
  text: string
}): RequestAnchorRecord | null {
  const text = input.text.trim()
  if (!text) return null

  return {
    id: input.messageID ?? `req_${Date.now()}`,
    sessionID: input.sessionID,
    projectPath: input.projectPath,
    content: text,
    createdAt: Date.now(),
  }
}
