import type { RequestAnchorRecord } from "../../memory/request/types.js"

export function captureRequestAnchor(input: {
  sessionID: string
  messageID?: string
  projectPath: string
  text: string
}): RequestAnchorRecord | null {
  const text = input.text.trim()
  if (!text) return null
  if (isPureMemoryRetrievalPrompt(text)) return null

  return {
    id: input.messageID ?? `req_${Date.now()}`,
    sessionID: input.sessionID,
    projectPath: input.projectPath,
    content: text,
    createdAt: Date.now(),
  }
}

const MEMORY_TOOL_PATTERN = /\bmemory_(search|timeline|details)\b/
const PURE_MEMORY_RETRIEVAL_HINTS = [
  /只做\s+memory\s*回查/,
  /只调用\s+memory_(search|timeline|details)/,
  /不要读取任何文件/,
  /do not read any files/i,
  /only call\s+memory_(search|timeline|details)/i,
]

function isPureMemoryRetrievalPrompt(text: string): boolean {
  if (!MEMORY_TOOL_PATTERN.test(text)) {
    return false
  }

  return PURE_MEMORY_RETRIEVAL_HINTS.some((pattern) => pattern.test(text))
}
