# 功能规格：Action-Led Context Tool Lines

**Feature Branch**: `[039-action-led-context-tool-lines]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- 这是一份 recent working index
- 覆盖 summaries / phases / tools / files / tokens
- 当前 index 通常已经足够继续工作
- 默认先信这份 index，再决定是否回读代码或历史
- 在需要更细节时再用下面这些工具
- 正常预算下，三种工具说明已经拆成三条独立 bullet

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 的这三条说明是“动作在前”
  - `Fetch by ID: ...`
  - `Search history: ...`
- 我们现在仍然是“工具名在前”
  - `memory_details=...`
  - `memory_timeline=...`
  - `memory_search=...`

所以这份规格只解决一个问题：

**把 `[CONTEXT INDEX]` 里三条工具 bullet 从“工具名在前”改成“动作在前”，让这一段更像操作说明而不是参数列表。**

本轮保持保守：

- 不改导语
- 不改 trust guidance
- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 的三条工具说明改成动作在前 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 的工具说明时，我希望先看到“要做什么动作”，再看到对应该用哪个工具。

**为什么这个优先级最高**：这是 `claude-mem` 同位置仍比我们多的一条可见输出差距，不是新能力，只是把工具说明编排得更像操作指南。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证工具说明变成 action-led wording。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** 工具说明应出现：
   - `Fetch by ID: ...`
   - `Expand a checkpoint window: ...`
   - `Search history: ...`

### 用户故事 2 - compaction context 继续不带这些 action-led 说明 (Priority: P2)

当 compaction context 生成时，我不希望因为 system header 的说明增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这些新 action-led 说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `Fetch by ID:` / `Expand a checkpoint window:` / `Search history:`。

## 边界情况

- action-led wording 必须短
- 只出现在正常预算的 system context
- 低预算压缩版仍保持单行压缩，避免挤掉 timeline
- compaction context 不引入这些 action-led wording

## 需求

### 功能需求

- **FR-001**：正常预算的 system context 必须把三条工具说明改成 action-led wording
- **FR-002**：action-led wording 必须保留原有语义：
  - `memory_details` 对应当前可见 ID 的 record detail
  - `memory_timeline` 对应 checkpoint window
  - `memory_search` 对应过去决策 / bug / deeper research
- **FR-003**：低预算压缩版仍可保持单行压缩，不强行展开 action-led wording
- **FR-004**：compaction context 不得引入这些新 wording
- **FR-005**：本轮不得修改导语、trust guidance、timeline、footer、schema、worker runtime

### 关键实体

- **ActionLedContextToolLine**：`[CONTEXT INDEX]` 中以动作开头的一条工具说明。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中可见 `Fetch by ID:` / `Expand a checkpoint window:` / `Search history:`
- **SC-002**：工具说明语义与当前版本一致，只改变表述顺序
- **SC-003**：低预算压缩版继续存在
- **SC-004**：compaction context 不出现这些新 wording
