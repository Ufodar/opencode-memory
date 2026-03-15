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

  test("summarizes read output without dumping raw file contents", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_3",
        args: { filePath: "/workspace/demo/README.md" },
        projectPath: "/workspace/demo",
      },
      {
        title: "",
        output: `<path>/workspace/demo/README.md</path>\n<type>file</type>\n<content>1: # Demo\n2: \n3: This is a very long file body that should not become the observation summary.</content>`,
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.content).toContain("README.md")
    expect(observation?.content).not.toContain("This is a very long file body")
    expect(observation?.output.summary).toContain("README.md")
    expect(observation?.output.summary).not.toContain("This is a very long file body")
  })

  test("does not capture memory self-query tools", () => {
    const observation = captureToolObservation(
      {
        tool: "memory_timeline",
        sessionID: "ses_demo",
        callID: "call_4",
        args: { query: "README" },
        projectPath: "/workspace/demo",
      },
      {
        title: "",
        output: "{\"success\":true,\"count\":1,\"results\":[]}",
        metadata: {},
      },
    )

    expect(observation).toBeNull()
  })

  test("classifies bash test commands as verification observations", () => {
    const observation = captureToolObservation(
      {
        tool: "bash",
        sessionID: "ses_demo",
        callID: "call_5",
        args: { command: "bun test" },
        projectPath: "/workspace/demo",
      },
      {
        title: "Run tests",
        output: "44 pass\n0 fail",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.phase).toBe("verification")
  })
})
