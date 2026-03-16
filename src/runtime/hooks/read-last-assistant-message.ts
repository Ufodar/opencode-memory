import type { PluginInput } from "@opencode-ai/plugin"

type SessionMessagePart = {
  type?: string
  text?: string
}

type SessionMessageWithParts = {
  info?: {
    role?: string
  }
  parts?: SessionMessagePart[]
}

export function createReadLastAssistantMessage(input: {
  client: PluginInput["client"]
}) {
  return async (sessionID?: string): Promise<string | undefined> => {
    if (!sessionID) return undefined

    const response = await input.client.session.messages(
      {
        path: {
          id: sessionID,
        },
        query: {
          limit: 100,
        },
      },
    )

    const messages = normalizeSessionMessages(response)
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]
      if (message.info?.role !== "assistant") continue

      const text = message.parts
        ?.filter((part): part is SessionMessagePart & { type: "text"; text: string } =>
          part.type === "text" && typeof part.text === "string",
        )
        .map((part) => part.text)
        .join("\n")
        .trim()

      if (text) {
        return text
      }
    }

    return undefined
  }
}

function normalizeSessionMessages(
  response: unknown,
): SessionMessageWithParts[] {
  if (Array.isArray(response)) {
    return response as SessionMessageWithParts[]
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: SessionMessageWithParts[] }).data
  }

  if (
    response &&
    typeof response === "object" &&
    "200" in response &&
    Array.isArray((response as { 200?: unknown })[200])
  ) {
    return (response as { 200: SessionMessageWithParts[] })[200]
  }

  return []
}
