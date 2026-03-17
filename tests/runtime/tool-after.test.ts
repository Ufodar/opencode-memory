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
    expect(observation?.content).toContain("Demo")
    expect(observation?.content).toContain("This is a very long file body")
    expect(observation?.content).not.toContain("<content>")
    expect(observation?.output.summary).toContain("Demo")
    expect(observation?.output.summary).toContain("This is a very long file body")
    expect(observation?.output.summary).not.toContain("<content>")
  })

  test("turns real read payload into semantic observation instead of path-only shorthand", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_semantic_read",
        args: {
          filePath: "/workspace/demo/brief.txt",
        },
        projectPath: "/workspace/demo",
      },
      {
        title: "",
        output: `<path>/workspace/demo/brief.txt</path>
<type>file</type>
<content>1: 这是一个真实 OpenCode 宿主 smoke 测试文件。
2:
3: 目标：
4: 1. 让 agent 使用 read 工具读取这个文件。
5: 2. 让 opencode-memory 通过 tool.execute.after 写入 observation。
6: 3. 在后续请求中通过 memory_search / memory_timeline / memory_details 找回这段连续性数据。

(End of file - total 6 lines)
</content>`,
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.content).toContain("真实 OpenCode 宿主 smoke 测试文件")
    expect(observation?.content).toContain("tool.execute.after 写入 observation")
    expect(observation?.content).not.toBe("read: demo/brief.txt")
    expect(observation?.content).not.toContain("<path>")
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

  test("captures file path trace from tool arguments", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_6",
        args: { filePath: "/workspace/demo/招标文件.docx" },
        projectPath: "/workspace/demo",
      },
      {
        title: "读取招标文件",
        output: "发现3条硬约束，并确认近三年业绩证明材料缺失。",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filePaths: ["/workspace/demo/招标文件.docx"],
      filesRead: ["/workspace/demo/招标文件.docx"],
    })
  })

  test("treats filesystem_read_text_file as a read-like observation", () => {
    const observation = captureToolObservation(
      {
        tool: "filesystem_read_text_file",
        sessionID: "ses_demo",
        callID: "call_fs_read",
        args: { path: "/workspace/demo/brief.txt" },
        projectPath: "/workspace/demo",
      },
      {
        title: "",
        output: "这是一份用于验证 opencode-memory 的测试文件。 其中包含一个语义短语：投标保函。",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.phase).toBe("research")
    expect(observation?.content).toContain("投标保函")
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filePaths: ["/workspace/demo/brief.txt"],
      filesRead: ["/workspace/demo/brief.txt"],
    })
  })

  test("captures modified file trace for write tools", () => {
    const observation = captureToolObservation(
      {
        tool: "write",
        sessionID: "ses_demo",
        callID: "call_7",
        args: { filePath: "/workspace/demo/questions.md" },
        projectPath: "/workspace/demo",
      },
      {
        title: "写入缺口清单",
        output: "已写入 questions.md",
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      filePaths: ["/workspace/demo/questions.md"],
      filesModified: ["/workspace/demo/questions.md"],
    })
  })

  test("captures bash command trace without inventing file reads", () => {
    const observation = captureToolObservation(
      {
        tool: "bash",
        sessionID: "ses_demo",
        callID: "call_8",
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
    expect(observation?.trace).toEqual({
      workingDirectory: "/workspace/demo",
      command: "bun test",
    })
  })
})
