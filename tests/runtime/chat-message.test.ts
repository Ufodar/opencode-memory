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

  test("skips English memory lookup-only prompts", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_3",
      projectPath: "/workspace/demo",
      text: "Memory lookup only. Do not read files. Use only memory_search for prior notes.",
    })

    expect(record).toBeNull()
  })

  test("skips English memory preview-only prompts", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_4",
      projectPath: "/workspace/demo",
      text: "Preview memory context only. Do not inspect repository files. Use only memory_context_preview.",
    })

    expect(record).toBeNull()
  })

  test("keeps English work prompts that mention memory tools conditionally", () => {
    const record = captureRequestAnchor({
      sessionID: "ses_demo",
      messageID: "msg_5",
      projectPath: "/workspace/demo",
      text: "Investigate the failing smoke report and use memory_search only if prior notes are needed.",
    })

    expect(record?.id).toBe("msg_5")
    expect(record?.content).toContain("Investigate the failing smoke report")
  })
})
