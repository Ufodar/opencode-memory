import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { buildSystemMemoryContext } from "../../src/runtime/injection/system-context.js"
import { captureToolObservation } from "../../src/runtime/hooks/tool-after.js"

describe("buildSystemMemoryContext", () => {
  test("starts with a short memory index guide for downstream tool use", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
    }).join("\n")

    expect(text).toContain("[CONTINUITY]")
    expect(text).toContain("[CONTEXT INDEX]")
    expect(text).toContain(
      "This semantic index (summaries, phases, tools, files, and tokens) is usually sufficient to understand past work.",
    )
    expect(text).not.toContain("Covers summaries, phases, tools, files, and tokens.")
    expect(text).not.toContain("Usually enough to continue work;")
    expect(text).toContain("Trust this index over re-reading code for past decisions and learnings.")
    expect(text).toContain("When you need implementation details, rationale, or debugging context:")
    expect(text).toContain(
      [
        "- Fetch by ID: memory_details(visible IDs) for record detail",
        "- Expand a checkpoint window: memory_timeline(checkpoint)",
        "- Search history: memory_search(decisions, bugs, deeper research)",
      ].join("\n"),
    )
    expect(
      text.indexOf("- Search history: memory_search(decisions, bugs, deeper research)") <
        text.indexOf("- Trust this index over re-reading code for past decisions and learnings."),
    ).toBe(true)
  })

  test("adds a short timeline legend for checkpoint tags", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
    }).join("\n")

    expect(text).toContain("[TIMELINE KEY]")
    expect(text).toContain("- [summary]: summary checkpoint marker")
    expect(text).toContain("- [research/planning/execution/verification/decision]: phase label")
    expect(text).toContain("- {tool}: source tool tag")
    expect(text).toContain("- [day]: day grouping line")
    expect(text).toContain("- [file]: file grouping line")
  })

  test("adds a short token key for observation token hints", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
    }).join("\n")

    expect(text).toContain("[TOKEN KEY]")
    expect(text).toContain("- Read: cost to read this memory now (cost to learn it now)")
    expect(text).toContain(
      "- Work: past work tokens already spent to produce it (research, building, deciding)",
    )
  })

  test("adds context economics with loading, work investment, savings, and coverage counts", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        nextStep: "输出缺口清单",
        observationIDs: ["obs_1", "obs_2", "obs_3"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_4",
        content: "写入 questions.md 并生成缺口清单初稿",
      }),
      buildObservation({
        id: "obs_5",
        content: "检查缺口清单格式并准备人工复核",
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text).toContain("[CONTEXT ECONOMICS]")
    expect(text).toContain("summaries: 1")
    expect(text).toContain("direct observations: 2")
    expect(text).toContain("covered observations: 3")
    expect(text).toContain("Loading:")
    expect(text).toContain("Work investment:")
    expect(text).toContain("Your savings:")
  })

  test("keeps loading, work investment, and savings visible when no summaries are injected", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [
        buildObservation({
          id: "obs_1",
          content: "读取 requirements.csv 并发现 evidence_source 列缺失",
        }),
      ],
    }).join("\n")

    expect(text).toContain("[CONTEXT ECONOMICS]")
    expect(text).toContain("summaries: 0")
    expect(text).toContain("direct observations: 1")
    expect(text).toContain("covered observations: 0")
    expect(text).toContain("Loading:")
    expect(text).toContain("Work investment:")
    expect(text).toContain("Your savings:")
  })

  test("adds a quantified context value footer that keeps the generic trust guidance", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        observationIDs: ["obs_1", "obs_2", "obs_3"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_4",
        content: "写入 questions.md 并生成缺口清单初稿",
      }),
      buildObservation({
        id: "obs_5",
        content: "检查缺口清单格式并准备人工复核",
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text).toContain("[CONTEXT VALUE]")
    expect(text).toContain("This index condenses")
    expect(text).toContain("trust it before re-reading past work")
    expect(text).toContain("Access ~")
    expect(text).toContain("tokens of past research, building, and decisions")
    expect(text).toContain("for just ~")
    expect(text).toContain("If this index is still not enough")
    expect(text).toContain(
      "use memory_details with visible IDs to access deeper memory before re-reading history",
    )
  })

  test("keeps the generic context value footer when the sample is too small for meaningful savings", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取单个文件",
        inputSummary: "",
        outputSummary: "读取单个文件",
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    }).join("\n")

    expect(text).toContain("[CONTEXT VALUE]")
    expect(text).toContain("This index condenses")
    expect(text).toContain("If this index is still not enough")
  })

  test("adds a project freshness header when projectPath is available", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo-project",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        observationIDs: [],
        createdAt: 20,
      },
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    }).join("\n")

    expect(text).toContain("# [demo-project] recent context, ")
  })

  test("still adds a generated timestamp when projectPath is unavailable", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
    }).join("\n")

    expect(text).not.toContain("Project:")
    expect(text).toContain("# recent context, ")
  })

  test("prefers summaries and excludes observations already covered by injected summaries", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        nextStep: "输出缺口清单",
        observationIDs: ["obs_1", "obs_2"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取第3章资格条件并定位到3条硬约束",
      }),
      buildObservation({
        id: "obs_2",
        content: "发现缺少近三年类似业绩证明材料",
      }),
      buildObservation({
        id: "obs_3",
        content: "写入缺口清单初稿到 questions.md",
        trace: {
          workingDirectory: "/workspace/demo",
          filesModified: ["/workspace/demo/questions.md"],
        },
      }),
    ]

    const system = buildSystemMemoryContext({ summaries, observations })
    const text = system.join("\n")

    expect(text).toContain("[CONTINUITY]")
    expect(text).toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).toContain("Current Focus: 抽取资格条件")
    expect(text).toContain("Learned: 读取第3章资格条件并定位到3条硬约束")
    expect(text).toContain("Completed: 已提取3条资格条件并发现1项材料缺口")
    expect(text).toContain("Next Steps: 输出缺口清单")
    expect(text).not.toContain("[MEMORY SUMMARY]")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("[RESUME GUIDE]")
    expect(text).toContain("输出缺口清单")
    expect(text).toContain("写入缺口清单初稿")
    expect(text).toContain("[file] questions.md")
    expect(text.match(/读取第3章资格条件并定位到3条硬约束/g)?.length).toBe(1)
    expect(text).not.toContain("- 发现缺少近三年类似业绩证明材料")
  })

  test("shows visible record IDs so memory_details can drill into current context", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "抽取资格条件",
        outcomeSummary: "已提取3条资格条件并发现1项材料缺口",
        nextStep: "输出缺口清单",
        observationIDs: ["obs_1", "obs_2"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_3",
        content: "写入缺口清单初稿到 questions.md",
        phase: "execution",
        trace: {
          workingDirectory: "/workspace/demo",
          filesModified: ["/workspace/demo/questions.md"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({ summaries, observations }).join("\n")

    expect(text).toContain("Summary ID: #sum_1")
    expect(text).toContain("[#obs_3]")
  })

  test("adds an Investigated field when latest summary observations expose stable evidence", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "检查 smoke 文档",
        outcomeSummary: "已完成 smoke 文档检查，并确认 snapshot 已进入 preview",
        nextStep: "继续进入最新 smoke 检查",
        observationIDs: ["obs_1", "obs_2"],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取 brief.txt 并确认 smoke 目标",
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
      buildObservation({
        id: "obs_2",
        content: "更新 checklist.md 并记录 smoke 检查项",
        trace: {
          workingDirectory: "/workspace/demo",
          filesModified: ["/workspace/demo/checklist.md"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({ summaries, observations }).join("\n")

    expect(text).toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).toContain("Investigated: brief.txt；checklist.md")
  })

  test("hides the latest snapshot when a newer direct observation exists and keeps the older summary in timeline", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "检查 smoke 文档",
        outcomeSummary: "已完成 smoke 文档检查",
        nextStep: "继续整理 smoke 结果",
        observationIDs: [],
        createdAt: 10,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "写入新的 smoke 观察并确认 preview 还需更新",
        createdAt: 20,
        phase: "execution",
      }),
    ]

    const text = buildSystemMemoryContext({ summaries, observations }).join("\n")

    expect(text).not.toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("[summary] 检查 smoke 文档：已完成 smoke 文档检查 (#sum_1)")
    expect(text).toContain("写入新的 smoke 观察并确认 preview 还需更新")
  })

  test("falls back to observations when no summaries exist", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取 requirements.csv 并发现 evidence_source 列缺失",
      }),
    ]

    const system = buildSystemMemoryContext({
      scope: "project",
      summaries: [],
      observations,
    })

    const text = system.join("\n")
    expect(text).toContain("Scope: project memory")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("evidence_source")
  })

  test("shows observation phases when falling back to observations", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "读取 requirements.csv 并发现 evidence_source 列缺失",
        phase: "research",
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/requirements.csv"],
        },
      }),
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    })

    const text = system.join("\n")
    expect(text).toContain("Scope: current session memory")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("[file] requirements.csv")
    expect(text).toContain("[research] {read} 读取 requirements.csv 并发现 evidence_source 列缺失")
  })

  test("expands the latest key observation into multiple timeline lines", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_old",
        content: "读取 requirements.csv 并确认 evidence_source 列仍缺失",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/requirements.csv"],
        },
      }),
      buildObservation({
        id: "obs_latest",
        content: "写入 questions.md 并生成缺口清单初稿",
        outputSummary: "已生成缺口清单初稿，待人工复核后进入正式写作",
        toolName: "write",
        phase: "execution",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
        trace: {
          workingDirectory: "/workspace/demo",
          filesModified: ["/workspace/demo/questions.md"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    }).join("\n")

    expect(text).toContain("[09:43] [execution] {write} 写入 questions.md 并生成缺口清单初稿")
    expect(text).toContain("  Result: 已生成缺口清单初稿")
    expect(text).toContain("待人工复核后进入正式写作")
    expect(text).toContain("  Tokens: Read ~")
    expect(text).toContain("| Work ~")
    expect(text).toContain("  Tool: write")
    expect(text).toContain("[09:41] [research] {read} 读取 requirements.csv 并确认 evidence_source 列仍缺失")
    expect(text).toContain("  Tool: read")
  })

  test("expands the two most recent key observations while leaving older ones collapsed", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_oldest",
        content: "读取 brief.txt 并确认 smoke 目标",
        toolName: "read",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
      buildObservation({
        id: "obs_mid",
        content: "读取 checklist.md 并确认 smoke 步骤",
        outputSummary: "已确认 smoke 步骤顺序正确，可以进入 questions.md 生成",
        toolName: "read",
        phase: "verification",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/checklist.md"],
        },
      }),
      buildObservation({
        id: "obs_latest",
        content: "写入 questions.md 并生成缺口清单初稿",
        outputSummary: "已生成缺口清单初稿，待人工复核后进入正式写作",
        toolName: "write",
        phase: "execution",
        createdAt: Date.UTC(2026, 2, 17, 9, 45),
        trace: {
          workingDirectory: "/workspace/demo",
          filesModified: ["/workspace/demo/questions.md"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    }).join("\n")

    expect(text).toContain("[09:45] [execution] {write} 写入 questions.md 并生成缺口清单初稿")
    expect(text).toContain("  Tokens: Read ~")
    expect(text).toContain("  Tool: write")
    expect(text).toContain("[09:43] [verification] {read} 读取 checklist.md 并确认 smoke 步骤")
    expect(text).toContain("已确认 smoke 步骤顺序正确")
    expect(text).toContain("可以进入 questions.md 生成")
    expect(text).toContain("  Tool: read")
    const oldestLine = "[09:41] [research] {read} 读取 brief.txt 并确认 smoke 目标"
    expect(text).toContain(oldestLine)
    expect(text).toContain(`${oldestLine} (Read ~`)
    expect(text).toContain("| Work ~")
    expect(text).not.toContain(`${oldestLine}\n  Tokens: Read ~`)
    expect(text).not.toContain(`${oldestLine}\n  Tool: read`)
  })

  test("respects count and character budgets", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_1",
        requestSummary: "A",
        outcomeSummary: "第一个很长的总结，用来占据大部分预算",
        observationIDs: [],
        createdAt: 10,
      },
      {
        id: "sum_2",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_2",
        requestSummary: "B",
        outcomeSummary: "第二个总结不应该被纳入",
        observationIDs: [],
        createdAt: 20,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "第一条 observation 可能会被预算裁掉",
        trace: {
          workingDirectory: "/workspace/demo",
          command: "python scripts/a.py",
        },
      }),
      buildObservation({
        id: "obs_2",
        content: "第二条 observation 也不一定能留下",
        trace: {
          workingDirectory: "/workspace/demo",
          command: "python scripts/b.py",
        },
      }),
    ]

    const system = buildSystemMemoryContext({
      summaries,
      observations,
      maxSummaries: 1,
      maxObservations: 1,
      maxChars: 420,
    })

    const text = system.join("\n")
    expect(text).toContain(
      "This semantic index (summaries, phases, tools, files, and tokens) is usually sufficient to understand past work.",
    )
    expect(text).not.toContain("第二个总结不应该被纳入")
    expect(text.length).toBeLessThanOrEqual(420)
  })

  test("resume guide prefers semantic observation text over read path shorthand", () => {
    const observation = captureToolObservation(
      {
        tool: "read",
        sessionID: "ses_demo",
        callID: "call_1",
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

(End of file - total 5 lines)
</content>`,
        metadata: {},
      },
    )

    expect(observation).not.toBeNull()

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [observation!],
    })

    const text = system.join("\n")
    expect(text).toContain("真实 OpenCode 宿主 smoke 测试文件")
    expect(text).not.toContain("Resume from latest observation: read: demo/brief.txt")
  })

  test("resume guide can fall back to latest summary when next step is absent", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查 smoke 文档",
        outcomeSummary: "已完成 smoke 文档检查，并确认 observation 语义摘要已经生效",
        observationIDs: ["obs_1"],
        createdAt: 30,
      },
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    })

    const text = system.join("\n")
    expect(text).toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).toContain("Current Focus: 检查 smoke 文档")
    expect(text).not.toContain("Learned:")
    expect(text).toContain("Completed: 已完成 smoke 文档检查，并确认 observation 语义摘要已经生效")
    expect(text).toContain("Next Steps: 继续从已完成 smoke 文档检查开始")
    expect(text).toContain("Pick up from: 已完成 smoke 文档检查")
  })

  test("curates long summary lines into shorter stage summaries", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_curated",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_curated",
        requestSummary: "验证 smoke 流程",
        outcomeSummary:
          "brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；让 opencode-memory 通过 tool.execute.after 写入 observation。；checklist.md：Smoke Checklist；插件在真实 OpenCode 宿主中加载。",
        nextStep: "继续检查 memory_context_preview 的输出",
        observationIDs: ["obs_1"],
        createdAt: 40,
      },
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    })

    const text = system.join("\n")
    expect(text).toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).not.toContain("[MEMORY SUMMARY]")
    expect(text).toContain("Completed: brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件")
    expect(text).toContain("目标：让 agent 使用 read 工具读取这个文件")
    expect(text).not.toContain("插件在真实 OpenCode 宿主中加载")
    expect(text).toContain("Next action: 继续检查 memory_context_preview 的输出")
  })

  test("deduplicates repeated curated summary lines", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_curated_1",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_curated_1",
        requestSummary: "验证 smoke 流程",
        outcomeSummary:
          "brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；后面的长尾不应影响去重。",
        observationIDs: ["obs_1"],
        createdAt: 41,
      },
      {
        id: "sum_curated_2",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_curated_2",
        requestSummary: "再次验证 smoke 流程",
        outcomeSummary:
          "brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；另一段不同的长尾也不应继续显示。",
        observationIDs: ["obs_2"],
        createdAt: 42,
      },
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    })

    const summaryLineCount = system.filter(
      (line) =>
        line.startsWith(
          "- [summary] 再次验证 smoke 流程：brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。",
        ) && line.includes("(#sum_curated_2)"),
    ).length

    expect(summaryLineCount).toBe(1)
  })

  test("moves older summaries into the unified timeline after latest snapshot absorbs the newest one", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        nextStep: "继续验证旧 summary 是否仍保留",
        observationIDs: ["obs_2"],
        createdAt: 50,
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "之前的准备工作",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        nextStep: "继续进入最新 smoke 检查",
        observationIDs: ["obs_1"],
        createdAt: 40,
      },
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    })

    const text = system.join("\n")
    expect(text).toContain("[LATEST SESSION SNAPSHOT]")
    expect(text).toContain("Current Focus: 检查最新 smoke")
    expect(text).toContain("Completed: 已完成最新 smoke 检查，并确认 snapshot 已进入 preview")
    expect(text).not.toContain("[MEMORY SUMMARY]")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("[summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).toContain("Next: 继续进入最新 smoke 检查")
    expect(text).not.toContain("已完成最新 smoke 检查，并确认 snapshot 已进入 preview\n  Next:")
  })

  test("falls back to outcome-only summary checkpoint when request summary is missing", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        nextStep: "继续验证旧 summary 是否仍保留",
        observationIDs: ["obs_2"],
        createdAt: 50,
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        nextStep: "继续进入最新 smoke 检查",
        observationIDs: ["obs_1"],
        createdAt: 40,
      },
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    })

    const text = system.join("\n")
    expect(text).toContain("[summary] 已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).not.toContain("[summary] ：已整理 smoke 前置条件并记录到 checklist.md")
  })

  test("adds short timestamps to summary and observation timeline checkpoints when real epoch timestamps exist", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        nextStep: "继续整理历史 checkpoint",
        observationIDs: ["obs_1"],
        createdAt: Date.UTC(2026, 2, 17, 9, 45),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "之前的准备工作",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        nextStep: "继续进入最新 smoke 检查",
        observationIDs: ["obs_2"],
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_3",
        content: "读取 requirements.csv 并补充时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text).toContain("[09:41] [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).toContain("[09:43] [research] {read} 读取 requirements.csv 并补充时间线验证")
  })

  test("keeps timeline checkpoints without time prefixes for synthetic timestamps", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        nextStep: "继续整理历史 checkpoint",
        observationIDs: ["obs_1"],
        createdAt: 50,
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "之前的准备工作",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        nextStep: "继续进入最新 smoke 检查",
        observationIDs: ["obs_2"],
        createdAt: 40,
      },
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations: [],
    }).join("\n")

    expect(text).toContain("[summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).not.toContain("[00:00] [summary]")
  })

  test("orders observation before summary when observation timestamp is earlier", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 45),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "整理 smoke 清单",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_earlier",
        content: "读取 requirements.csv 并补充时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    const observationIndex = text.indexOf("[09:41] [research] {read} 读取 requirements.csv 并补充时间线验证")
    const summaryIndex = text.indexOf("[09:43] [summary] 整理 smoke 清单：已整理 smoke 前置条件并记录到 checklist.md")

    expect(observationIndex).toBeGreaterThan(-1)
    expect(summaryIndex).toBeGreaterThan(-1)
    expect(observationIndex).toBeLessThan(summaryIndex)
  })

  test("keeps summary before observation when summary timestamp is earlier", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 45),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "整理 smoke 清单",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_later",
        content: "读取 requirements.csv 并补充时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    const summaryIndex = text.indexOf("[09:41] [summary] 整理 smoke 清单：已整理 smoke 前置条件并记录到 checklist.md")
    const observationIndex = text.indexOf("[09:43] [research] {read} 读取 requirements.csv 并补充时间线验证")

    expect(summaryIndex).toBeGreaterThan(-1)
    expect(observationIndex).toBeGreaterThan(-1)
    expect(summaryIndex).toBeLessThan(observationIndex)
  })

  test("inserts day grouping lines when timeline checkpoints span multiple days", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 0, 20),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "整理 smoke 清单",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 16, 23, 50),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_next_day",
        content: "读取 requirements.csv 并补充次日时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 0, 10),
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text).toContain("[day] 2026-03-16")
    expect(text).toContain("[day] 2026-03-17")
    expect(text.indexOf("[day] 2026-03-16")).toBeLessThan(text.indexOf("[23:50] [summary] 整理 smoke 清单：已整理 smoke 前置条件并记录到 checklist.md"))
    expect(text.indexOf("[day] 2026-03-17")).toBeLessThan(text.indexOf("[00:10] [research] {read} 读取 requirements.csv 并补充次日时间线验证"))
  })

  test("does not insert day grouping lines for single-day timelines", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 45),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "整理 smoke 清单",
        outcomeSummary: "已整理 smoke 前置条件并记录到 checklist.md",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_same_day",
        content: "读取 requirements.csv 并补充单日时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text).not.toContain("[day] 2026-")
  })

  test("inserts file grouping lines for observation checkpoints within the same day", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_brief_1",
        content: "读取 brief.txt 并确认 smoke 目标",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
      buildObservation({
        id: "obs_brief_2",
        content: "再次读取 brief.txt 并补充要点",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 42),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
      buildObservation({
        id: "obs_checklist",
        content: "读取 checklist.md 并确认 smoke 步骤",
        phase: "verification",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/checklist.md"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    }).join("\n")

    expect(text).toContain("[file] brief.txt")
    expect(text).toContain("[file] checklist.md")
    expect(text.indexOf("[file] brief.txt")).toBeLessThan(
      text.indexOf("[09:41] [research] {read} 读取 brief.txt 并确认 smoke 目标"),
    )
    expect(text.indexOf("[file] checklist.md")).toBeLessThan(
      text.indexOf("[09:43] [verification] {read} 读取 checklist.md 并确认 smoke 步骤"),
    )
    expect(text.match(/\[file\] brief\.txt/g)?.length).toBe(1)
  })

  test("restarts file grouping after a summary checkpoint breaks the observation stream", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_latest",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_latest",
        requestSummary: "检查最新 smoke",
        outcomeSummary: "已完成最新 smoke 检查，并确认 snapshot 已进入 preview",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 44),
      },
      {
        id: "sum_previous",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_previous",
        requestSummary: "整理 brief",
        outcomeSummary: "已整理 brief.txt 的 smoke 目标",
        observationIDs: [],
        createdAt: Date.UTC(2026, 2, 17, 9, 42),
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_before_summary",
        content: "读取 brief.txt 并确认 smoke 目标",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
      buildObservation({
        id: "obs_after_summary",
        content: "再次读取 brief.txt 并补充 resume 线索",
        phase: "verification",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries,
      observations,
    }).join("\n")

    expect(text.match(/\[file\] brief\.txt/g)?.length).toBe(2)
    expect(text.indexOf("[file] brief.txt")).toBeLessThan(
      text.indexOf("[09:41] [research] {read} 读取 brief.txt 并确认 smoke 目标"),
    )
    expect(text.lastIndexOf("[file] brief.txt")).toBeGreaterThan(
      text.indexOf("[09:42] [summary] 整理 brief：已整理 brief.txt 的 smoke 目标"),
    )
  })

  test("removes redundant file hints once a file grouping line is present", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_brief_1",
        content: "读取 brief.txt 并确认 smoke 目标",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
    ]

    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    }).join("\n")

    expect(text).toContain("[file] brief.txt")
    expect(text).not.toContain("(files: brief.txt)")
  })

  test("curates long observation lines into shorter timeline checkpoints", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_curated",
        content:
          "brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；让 opencode-memory 通过 tool.execute.after 写入 observation。；这一条不应该继续出现在 timeline 里。",
        phase: "research",
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
    ]

    const system = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations,
    })

    const text = system.join("\n")
    expect(text).toContain("[MEMORY TIMELINE]")
    expect(text).toContain("[file] brief.txt")
    expect(text).toContain("[research] {read} brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件")
    expect(text).not.toContain("这一条不应该继续出现在 timeline 里")
    expect(text).not.toContain("(files: brief.txt)")
  })

  test("appends a previously section when a prior assistant handoff is available", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
      priorAssistantMessage:
        "已完成 brief.txt 检查。\n\n下一步进入 requirements.csv，并核对 evidence_source 列。",
    }).join("\n")

    expect(text).toContain("[PREVIOUSLY]")
    expect(text).toContain(
      "A: 已完成 brief.txt 检查。 下一步进入 requirements.csv，并核对 evidence_source 列。",
    )
  })

  test("does not render a previously section when no prior assistant handoff exists", () => {
    const text = buildSystemMemoryContext({
      scope: "session",
      summaries: [],
      observations: [],
    }).join("\n")

    expect(text).not.toContain("[PREVIOUSLY]")
  })
})

function buildObservation(input: {
  id: string
  content: string
  phase?: ObservationRecord["phase"]
  trace?: ObservationRecord["trace"]
  createdAt?: number
  inputSummary?: string
  outputSummary?: string
  toolName?: string
  toolTitle?: string
}): ObservationRecord {
  return {
    id: input.id,
    content: input.content,
    sessionID: "ses_demo",
    projectPath: "/workspace/demo",
    createdAt: input.createdAt ?? 10,
    phase: input.phase,
    tool: {
      name: input.toolName ?? "read",
      callID: `call_${input.id}`,
      title: input.toolTitle,
      status: "success",
    },
    input: {
      summary: input.inputSummary ?? "读取文件",
    },
    output: {
      summary: input.outputSummary ?? input.content,
    },
    retrieval: {
      importance: 0.8,
      tags: ["observation"],
    },
    trace: input.trace ?? {},
  }
}
