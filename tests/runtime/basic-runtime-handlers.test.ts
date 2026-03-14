import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { RequestAnchorRecord } from "../../src/memory/request/types.js"
import { createChatMessageHandler } from "../../src/runtime/handlers/chat-message-event.js"
import { createToolExecuteAfterHandler } from "../../src/runtime/handlers/tool-execute-after.js"

describe("basic runtime handlers", () => {
  test("chat.message captures and saves a request anchor", async () => {
    const saved: RequestAnchorRecord[] = []

    const handler = createChatMessageHandler({
      projectPath: "/workspace/demo",
      saveRequestAnchor(record) {
        saved.push(record)
      },
      captureRequestAnchor(input) {
        return {
          id: input.messageID ?? "req_1",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
          content: input.text,
          createdAt: 1,
        }
      },
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

    expect(saved).toHaveLength(1)
    expect(saved[0]?.id).toBe("msg_1")
    expect(saved[0]?.content).toBe("梳理第3章资格条件")
  })

  test("tool.execute.after captures and saves an observation", async () => {
    const saved: ObservationRecord[] = []
    const calls: string[] = []

    const handler = createToolExecuteAfterHandler({
      projectPath: "/workspace/demo",
      saveObservation(record) {
        saved.push(record)
      },
      captureToolObservation(input) {
        calls.push(`capture:${input.tool}`)
        return {
          id: "obs_1",
          content: "确认存在3条资格条件约束",
          sessionID: input.sessionID,
          projectPath: input.projectPath,
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
        }
      },
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

    expect(saved).toHaveLength(1)
    expect(saved[0]?.id).toBe("obs_1")
    expect(calls).toEqual(["capture:read", "log:captured observation"])
  })
})
