import { describe, expect, test } from "bun:test"

import { captureRequestAnchor } from "../../src/runtime/hooks/chat-message.js"

describe("captureRequestAnchor", () => {
  test("skips pure memory retrieval prompts", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_1",
      projectPath: "/workspace/demo",
      text: "只做 memory 回查，不要读取任何文件。只调用 memory_search 查询 brief。",
    })

    expect(record).toBeNull()
  })

  test("keeps normal work prompts even if they mention memory tools", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_1",
      projectPath: "/workspace/demo",
      text: "先分析招标文件，再在必要时用 memory_search 对照之前的结论。",
    })

    expect(record?.id).toBe("msg_1")
    expect(record?.content).toContain("先分析招标文件")
  })

  test("skips pure memory context preview prompts", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_2",
      projectPath: "/workspace/demo",
      text: "只做记忆上下文预览，不要读取任何文件。只调用 memory_context_preview。",
    })

    expect(record).toBeNull()
  })
})
