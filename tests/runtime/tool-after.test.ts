import { describe, expect, test } from "bun:test"

import { captureToolObservation } from "../../src/runtime/hooks/tool-after.js"

describe("captureToolObservation", () => {
  test("prefers semantic output text over generic tool title", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
        args: { file: "招标文件.docx" },
        projectPath: "/workspace/demo",
      },
      {
        title: "captured tool result",
        output: "发现3条硬约束，并确认近三年业绩证明材料缺失。",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.content).toContain("发现3条硬约束")
    expect(observation?.content).not.toBe("read: captured tool result")
  })

  test("falls back to tool title when output text is empty", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_2",
        args: { file: "招标文件.docx" },
        projectPath: "/workspace/demo",
      },
      {
        title: "读取招标文件第3章",
        output: "",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.content).toBe("read: 读取招标文件第3章")
  })
})
