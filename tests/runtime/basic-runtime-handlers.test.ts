import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { createChatMessageHandler } from "../../src/runtime/handlers/chat-message-event.js"
import { createToolExecuteAfterHandler } from "../../src/runtime/handlers/tool-execute-after.js"
import type { MemoryWorkerService } from "../../src/services/memory-worker-service.js"

describe("basic runtime handlers", () => {
  test("chat.message delegates request-anchor capture to the memory worker", async () => {
    const calls: string[] = []

    const handler = createChatMessageHandler({
      worker: {
        async handleSessionIdle(sessionID) {
          calls.push(`idle:${sessionID}`)
          return { status: "no-op" as const }
        },
        captureRequestAnchorFromMessage(input) {
          calls.push(`request:${input.sessionID}:${input.messageID}`)
          return {
            id: input.messageID ?? "req_1",
            sessionID: input.sessionID,
            projectPath: "/workspace/demo",
            content: input.text,
            createdAt: 1,
          } satisfies RequestAnchorRecord
        },
      } as Pick<MemoryWorkerService, "handleSessionIdle" | "captureRequestAnchorFromMessage">,
    })

    await handler(
      { sessionID: "ses_demo" },
      {
        message: { id: "msg_1" },
        parts: [
          { type: "text", text: "梳理第3章资格条件" },
          { type: "tool-call", toolCallID: "call_1", toolName: "read", args: {} },
        ],
      },
    )

    expect(calls).toEqual(["idle:ses_demo", "request:ses_demo:msg_1"])
  })

  test("tool.execute.after delegates observation capture to the memory worker", async () => {
    const calls: string[] = []

    const handler = createToolExecuteAfterHandler({
      worker: {
        captureObservationFromToolCall(input) {
          calls.push(`capture:${input.tool}`)
          return {
            id: "obs_1",
            content: "确认存在3条资格条件约束",
            sessionID: input.sessionID,
            projectPath: "/workspace/demo",
            createdAt: 1,
            tool: {
              name: input.tool,
              callID: input.callID,
              status: "success",
            },
            input: { summary: "读取第3章" },
            output: { summary: "发现3条约束" },
            retrieval: { importance: 0.9, tags: ["read", "observation"] },
            trace: {},
          } satisfies ObservationRecord
        },
      } as Pick<MemoryWorkerService, "captureObservationFromToolCall">,
      log(message) {
        calls.push(`log:${message}`)
      },
    })

    await handler(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
        args: { filePath: "招标文件.docx" },
      },
      {
        title: "读取招标文件",
        output: "第3章资格条件",
        metadata: {},
      },
    )

    expect(calls).toEqual(["capture:read", "log:captured observation"])
  })
})
