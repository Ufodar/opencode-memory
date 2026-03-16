import { describe, expect, test } from "bun:test"

import type { ObservationRecord } from "../../src/memory/observation/types.js"
import type { SummaryRecord } from "../../src/memory/summary/types.js"
import { buildCompactionMemoryContext } from "../../src/runtime/injection/compaction-context.js"

describe("buildCompactionMemoryContext", () => {
  test("does not include the system memory index guide", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("[CONTEXT INDEX]")
    expect(text).not.toContain("This memory snapshot is a recent working index.")
    expect(text).not.toContain("Covers summaries, phases, tools, files, and tokens.")
    expect(text).not.toContain("Trust this index before re-reading code or past history.")
    expect(text).not.toContain("past decisions, bugs, deeper research")
    expect(text).not.toContain("memory_details")
    expect(text).not.toContain("memory_timeline=checkpoint window")
    expect(text).not.toContain("memory_timeline")
    expect(text).not.toContain("memory_search")
  })

  test("does not include the system timeline legend", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("[TIMELINE KEY]")
    expect(text).not.toContain("[summary] = checkpoint")
    expect(text).not.toContain("[day] = date group")
  })

  test("does not include the system token key", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("[TOKEN KEY]")
    expect(text).not.toContain("Read=current reading cost")
    expect(text).not.toContain("Work=prior work investment")
  })

  test("does not include the system context economics section", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("[CONTEXT ECONOMICS]")
  })

  test("does not include the system context value footer", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("[CONTEXT VALUE]")
    expect(text).not.toContain("trust it before re-reading past work")
  })

  test("does not include expanded observation token hints", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("Tokens: Read ~")
    expect(text).not.toContain("| Work ~")
  })

  test("does not include inline observation token hints on compaction timeline rows", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [
        buildObservation({
          id: "obs_inline",
          content: "读取 brief.txt 并确认 smoke 目标",
          phase: "research",
          toolName: "read",
          createdAt: Date.UTC(2026, 2, 17, 9, 41),
          trace: {
            workingDirectory: "/workspace/demo",
            filesRead: ["/workspace/demo/brief.txt"],
          },
        }),
      ],
      maxChars: 320,
    }).join("\n")

    expect(text).toContain("[research] 读取 brief.txt 并确认 smoke 目标")
    expect(text).not.toContain("[research] 读取 brief.txt 并确认 smoke 目标 (Read ~")
  })

  test("does not include the system project freshness header", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("Project:")
    expect(text).not.toContain("Generated:")
  })

  test("does not require visible record IDs in compaction context", () => {
    const text = buildCompactionMemoryContext({
      summaries: [],
      observations: [],
      maxChars: 220,
    }).join("\n")

    expect(text).not.toContain("Summary ID:")
    expect(text).not.toContain("[#obs_")
  })

  test("prefers summaries and only keeps unsummarized observations", () => {
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
        phase: "research",
      }),
      buildObservation({
        id: "obs_2",
        content: "发现缺少近三年类似业绩证明材料",
        phase: "research",
      }),
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

    const context = buildCompactionMemoryContext({ summaries, observations })
    const text = context.join("\n")

    expect(text).toContain("[CONTINUITY CHECKPOINTS]")
    expect(text).toContain("Latest session snapshot:")
    expect(text).toContain("- Current Focus: 抽取资格条件")
    expect(text).toContain("- Learned: 读取第3章资格条件并定位到3条硬约束")
    expect(text).toContain("- Completed: 已提取3条资格条件并发现1项材料缺口")
    expect(text).toContain("- Next: 输出缺口清单")
    expect(text).not.toContain("Recent memory summaries:")
    expect(text).toContain("输出缺口清单")
    expect(text).toContain("Recent timeline checkpoints:")
    expect(text).toContain("[file] questions.md")
    expect(text).toContain("[execution] 写入缺口清单初稿到 questions.md")
    expect(text.match(/读取第3章资格条件并定位到3条硬约束/g)?.length).toBe(1)
    expect(text).not.toContain("- 发现缺少近三年类似业绩证明材料")
  })

  test("reuses the Investigated field in compaction snapshot when latest summary observations expose stable evidence", () => {
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

    const text = buildCompactionMemoryContext({ summaries, observations }).join("\n")

    expect(text).toContain("Investigated: brief.txt；checklist.md")
  })

  test("hides stale latest snapshot when a newer direct observation exists", () => {
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

    const text = buildCompactionMemoryContext({ summaries, observations }).join("\n")

    expect(text).not.toContain("Latest session snapshot:")
    expect(text).toContain("Recent timeline checkpoints:")
    expect(text).toContain("[summary] 检查 smoke 文档：已完成 smoke 文档检查")
    expect(text).toContain("[execution] 写入新的 smoke 观察并确认 preview 还需更新")
  })

  test("respects compaction character budget", () => {
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

    const context = buildCompactionMemoryContext({
      summaries,
      observations: [],
      maxChars: 220,
      maxSummaries: 1,
    })

    const text = context.join("\n")
    expect(text).toContain("第一个很长的总结")
    expect(text).not.toContain("第二个总结不应该被纳入")
    expect(text.length).toBeLessThanOrEqual(220)
  })

  test("keeps command evidence hints within compaction budget", () => {
    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_1",
        content: "运行缺口整理脚本并刷新结果",
        phase: "execution",
        trace: {
          workingDirectory: "/workspace/demo",
          command: "python scripts/build_gap_report.py",
        },
      }),
    ]

    const context = buildCompactionMemoryContext({
      summaries: [],
      observations,
      maxChars: 260,
      maxObservations: 1,
    })

    const text = context.join("\n")
    expect(text).toContain("cmd: python scripts/build_gap_report.py")
    expect(text.length).toBeLessThanOrEqual(260)
  })

  test("expands the latest key observation in compaction checkpoints", () => {
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

    const text = buildCompactionMemoryContext({
      summaries: [],
      observations,
      maxChars: 760,
    }).join("\n")

    expect(text).toContain("[09:43] [execution] 写入 questions.md 并生成缺口清单初稿")
    expect(text).toContain("  Result: 已生成缺口清单初稿")
    expect(text).toContain("待人工复核后进入正式写作")
    expect(text).toContain("  Tool: write")
    expect(text).toContain("[09:41] [research] 读取 requirements.csv 并确认 evidence_source 列仍缺失")
    expect(text).toContain("  Tool: read")
  })

  test("expands the two most recent key observations in compaction while leaving older ones collapsed", () => {
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

    const text = buildCompactionMemoryContext({
      summaries: [],
      observations,
      maxChars: 960,
    }).join("\n")

    expect(text).toContain("[09:45] [execution] 写入 questions.md 并生成缺口清单初稿")
    expect(text).toContain("  Tool: write")
    expect(text).toContain("[09:43] [verification] 读取 checklist.md 并确认 smoke 步骤")
    expect(text).toContain("已确认 smoke 步骤顺序正确")
    expect(text).toContain("可以进入 questions.md 生成")
    expect(text).toContain("  Tool: read")
    const oldestLine = "[09:41] [research] 读取 brief.txt 并确认 smoke 目标"
    expect(text).toContain(oldestLine)
    expect(text).not.toContain(`${oldestLine}\n  Tool: read`)
  })

  test("curates long summary and observation lines for compaction checkpoints", () => {
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
        observationIDs: [],
        createdAt: 30,
      },
    ]

    const observations: ObservationRecord[] = [
      buildObservation({
        id: "obs_curated",
        content:
          "brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；让 opencode-memory 通过 tool.execute.after 写入 observation。；这一条不应该继续出现在 compaction observation 里。",
        phase: "research",
        trace: {
          workingDirectory: "/workspace/demo",
          filesRead: ["/workspace/demo/brief.txt"],
        },
      }),
    ]

    const context = buildCompactionMemoryContext({
      summaries,
      observations,
      maxChars: 680,
    })

    const text = context.join("\n")
    expect(text).toContain("Latest session snapshot:")
    expect(text).toContain("- Completed: brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件")
    expect(text).toContain("- Next: 继续检查 memory_context_preview 的输出")
    expect(text).not.toContain("Recent memory summaries:")
    expect(text).not.toContain("插件在真实 OpenCode 宿主中加载")
    expect(text).toContain("[file] brief.txt")
    expect(text).toContain("[research] brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件")
    expect(text).not.toContain("这一条不应该继续出现在 compaction observation 里")
    expect(text).not.toContain("(files: brief.txt)")
  })

  test("builds snapshot fallback when latest summary has no next step", () => {
    const summaries: SummaryRecord[] = [
      {
        id: "sum_snapshot",
        sessionID: "ses_demo",
        projectPath: "/workspace/demo",
        requestAnchorID: "req_snapshot",
        requestSummary: "检查 smoke 文档",
        outcomeSummary: "已完成 smoke 文档检查，并确认当前 preview 已按结构化 section 输出",
        observationIDs: ["obs_1"],
        createdAt: 35,
      },
    ]

    const context = buildCompactionMemoryContext({
      summaries,
      observations: [],
      maxChars: 360,
    })

    const text = context.join("\n")
    expect(text).toContain("Latest session snapshot:")
    expect(text).toContain("- Current Focus: 检查 smoke 文档")
    expect(text).not.toContain("- Learned:")
    expect(text).toContain("- Completed: 已完成 smoke 文档检查，并确认当前 preview 已按结构化 section 输出")
    expect(text).toContain("- Next: 继续从已完成 smoke 文档检查开始")
  })

  test("moves older compaction summaries into the unified timeline after latest snapshot absorbs the newest one", () => {
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
        createdAt: 60,
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
        createdAt: 50,
      },
    ]

    const context = buildCompactionMemoryContext({
      summaries,
      observations: [],
      maxChars: 520,
    })

    const text = context.join("\n")
    expect(text).toContain("Latest session snapshot:")
    expect(text).toContain("- Current Focus: 检查最新 smoke")
    expect(text).not.toContain("Recent memory summaries:")
    expect(text).toContain("Recent timeline checkpoints:")
    expect(text).toContain("[summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).toContain("Next: 继续进入最新 smoke 检查")
    expect(text).not.toContain("[summary] 已完成最新 smoke 检查，并确认 snapshot 已进入 preview")
  })

  test("adds short timestamps to compaction timeline checkpoints when real epoch timestamps exist", () => {
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
        content: "读取 requirements.csv 并补充 compaction 时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 43),
      }),
    ]

    const text = buildCompactionMemoryContext({
      summaries,
      observations,
      maxChars: 620,
    }).join("\n")

    expect(text).toContain("[09:41] [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md")
    expect(text).toContain("[09:43] [research] 读取 requirements.csv 并补充 compaction 时间线验证")
  })

  test("orders compaction timeline checkpoints chronologically across summaries and observations", () => {
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
        content: "读取 requirements.csv 并补充 compaction 时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 9, 41),
      }),
    ]

    const text = buildCompactionMemoryContext({
      summaries,
      observations,
      maxChars: 620,
    }).join("\n")

    const observationIndex = text.indexOf("[09:41] [research] 读取 requirements.csv 并补充 compaction 时间线验证")
    const summaryIndex = text.indexOf("[09:43] [summary] 整理 smoke 清单：已整理 smoke 前置条件并记录到 checklist.md")

    expect(observationIndex).toBeGreaterThan(-1)
    expect(summaryIndex).toBeGreaterThan(-1)
    expect(observationIndex).toBeLessThan(summaryIndex)
  })

  test("inserts day grouping lines for multi-day compaction timelines", () => {
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
        content: "读取 requirements.csv 并补充次日 compaction 时间线验证",
        phase: "research",
        createdAt: Date.UTC(2026, 2, 17, 0, 10),
      }),
    ]

    const text = buildCompactionMemoryContext({
      summaries,
      observations,
      maxChars: 720,
    }).join("\n")

    expect(text).toContain("[day] 2026-03-16")
    expect(text).toContain("[day] 2026-03-17")
    expect(text.indexOf("[day] 2026-03-16")).toBeLessThan(text.indexOf("[23:50] [summary] 整理 smoke 清单：已整理 smoke 前置条件并记录到 checklist.md"))
    expect(text.indexOf("[day] 2026-03-17")).toBeLessThan(text.indexOf("[00:10] [research] 读取 requirements.csv 并补充次日 compaction 时间线验证"))
  })

  test("inserts file grouping lines for compaction observation checkpoints within the same day", () => {
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

    const text = buildCompactionMemoryContext({
      summaries: [],
      observations,
      maxChars: 720,
    }).join("\n")

    expect(text).toContain("[file] brief.txt")
    expect(text).toContain("[file] checklist.md")
    expect(text.indexOf("[file] brief.txt")).toBeLessThan(
      text.indexOf("[09:41] [research] 读取 brief.txt 并确认 smoke 目标"),
    )
    expect(text.indexOf("[file] checklist.md")).toBeLessThan(
      text.indexOf("[09:43] [verification] 读取 checklist.md 并确认 smoke 步骤"),
    )
  })

  test("removes redundant file hints in compaction once a file grouping line is present", () => {
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

    const text = buildCompactionMemoryContext({
      summaries: [],
      observations,
      maxChars: 720,
    }).join("\n")

    expect(text).toContain("[file] brief.txt")
    expect(text).not.toContain("(files: brief.txt)")
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
