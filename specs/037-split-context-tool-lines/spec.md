# 功能规格：Split Context Tool Lines

**Feature Branch**: `[037-split-context-tool-lines]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- 这是 recent working index
- 覆盖 summaries / phases / tools / files / tokens
- 当前 index 通常已经足够继续工作
- 默认先信这份 index，再决定是否回读代码或历史
- `memory_details / memory_timeline / memory_search` 的用途

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不把工具说明挤成一行
- 它会把：
  - 按 ID 取细节
  - 扩 checkpoint 时间线
  - 搜过去决策/bug/研究
  分成多行

所以这份规格只解决一个问题：

**让 `[CONTEXT INDEX]` 在预算足够时，把三种 memory 工具说明拆成独立 bullet；预算不足时继续保留单行压缩版。**

本轮保持保守：

- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 里的工具说明更易读 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它不是在一行里读完三种工具，而是能逐行看到每个工具的用途。

**为什么这个优先级最高**：这是 `claude-mem` 在同位置仍领先我们的可见输出差距，不是新能力，只是把已有工具说明分开呈现。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 system context 中三种工具说明各占一行。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `memory_details`、`memory_timeline`、`memory_search` 各自应该占独立 bullet。

### 用户故事 2 - 低预算场景继续用压缩版 (Priority: P2)

当 system context 预算很紧时，我不希望只是为了更易读就把真正的 timeline 挤掉。

**独立测试方式**：调用 `buildSystemMemoryContext()` 的低预算场景，验证仍保留单行压缩版，不影响既有预算测试。

**验收场景**：

1. **Given** 低预算 system context，**When** 输出生成，**Then** 工具说明仍可压缩成一行。

### 用户故事 3 - compaction context 继续不带这些说明 (Priority: P2)

当 compaction context 生成时，我不希望因为 system header 的可读性增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现分行后的工具说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现分行后的工具说明。

## 边界情况

- 只拆三种 memory 工具说明
- 不改它们的语义
- 低预算系统上下文允许继续使用单行压缩版

## 需求

### 功能需求

- **FR-001**：正常预算下，system context 的三种 memory 工具说明必须各占一行
- **FR-002**：低预算 system context 可以回退到单行压缩版
- **FR-003**：compaction context 不得引入这些说明
- **FR-004**：这轮不得修改 timeline、footer、schema、worker runtime

### 关键实体

- **ContextToolGuidanceLines**：`[CONTEXT INDEX]` section 中描述 `memory_details / memory_timeline / memory_search` 用途的多行 bullet。

## 成功标准

### 可衡量结果

- **SC-001**：正常预算 system context 中可见三条独立工具说明
- **SC-002**：低预算 system context 继续通过既有预算测试
- **SC-003**：compaction context 不出现这些说明
