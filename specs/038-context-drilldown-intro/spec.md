# 功能规格：Context Drilldown Intro

**Feature Branch**: `[038-context-drilldown-intro]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- 这是 recent working index
- 覆盖 summaries / phases / tools / files / tokens
- 当前 index 通常已经足够继续工作
- 默认先信这份 index，再决定是否回读代码或历史
- 三种 memory 工具说明在正常预算下已经拆成多行

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 在工具说明前还有一行导语：
  - 当你真的需要实现细节、理由、调试上下文时，再用下面这些工具
- 我们现在还缺这一句过渡

所以这份规格只解决一个问题：

**在 `[CONTEXT INDEX]` 的工具说明前，增加一条短的 drilldown intro，明确下面这些工具是“需要更细上下文时才用”。**

本轮保持保守：

- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 在工具说明前有过渡句 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它先看到一条过渡句，知道下面的 `memory_details / memory_timeline / memory_search` 是在需要更细节时才用。

**为什么这个优先级最高**：这是 `claude-mem` 同位置仍比我们多的一条可见输出，不是新能力，只是让工具说明入口更自然。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 tool guidance 前出现一条 drilldown intro。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** 在工具说明前应出现一条“当需要更细节/理由/调试上下文时再下钻”的说明。

### 用户故事 2 - compaction context 继续不带这条说明 (Priority: P2)

当 compaction context 生成时，我不希望因为 system header 的导语增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这条导语。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现这条 drilldown intro。

## 边界情况

- 说明必须短
- 只出现在 system context
- 不改现有工具说明语义

## 需求

### 功能需求

- **FR-001**：system context header 必须在工具说明前增加一条 drilldown intro
- **FR-002**：这条说明必须表达“需要更细节/理由/调试上下文时，再用下面这些工具”
- **FR-003**：compaction context 不得引入这条说明
- **FR-004**：这轮不得修改 timeline、footer、schema、worker runtime

### 关键实体

- **ContextDrilldownIntroLine**：`[CONTEXT INDEX]` section 中位于工具说明前的一条短导语。

## 成功标准

### 可衡量结果

- **SC-001**：system context header 中可见一条 drilldown intro
- **SC-002**：工具说明仍然保留在导语后面
- **SC-003**：compaction context 不出现这条说明
