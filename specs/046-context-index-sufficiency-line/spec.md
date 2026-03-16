# 功能规格：Context Index Sufficiency Line

**Feature Branch**: `[046-context-index-sufficiency-line]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 第一行已经会说：

- `This semantic index (summaries, phases, tools, files, and tokens) is a recent working index.`

但和 `claude-mem` 同位置对照后，当前还缺一处可见 wording：

- `claude-mem` 在同一句里直接说：
  - `is usually sufficient to understand past work`

所以这份规格只解决一个问题：

**把 `[CONTEXT INDEX]` 第一行从“recent working index”推进成“usually sufficient to understand past work”的写法。**

本轮保持保守：

- 不改第二行 coverage bullet
- 不改 trust line
- 不改 drilldown bullets
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 economics / footer
- 不改 compaction context 边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 首句直接表达 sufficiency (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 第一行时，我希望它第一眼就知道：

- 这是一份 semantic index
- 它通常已经足够理解 past work

**为什么这个优先级最高**：这是 `claude-mem` 同位置还领先我们的一条可见 wording，不是新能力，只是首句更像成熟的 header。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证第一行包含 `usually sufficient to understand past work`。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `[CONTEXT INDEX]` 第一行应包含 sufficiency wording。

### 用户故事 2 - compaction context 继续不带这句 wording (Priority: P2)

当 compaction context 生成时，我不希望 system header wording 的变化污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现这句 sufficiency wording。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现这句 sufficiency wording。

## 边界情况

- 只改 system context 第一行
- 不能顺手改第二行 coverage bullet、trust line 或 drilldown bullets
- compaction context 继续不引入这句

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 第一行必须包含 `usually sufficient to understand past work`
- **FR-002**：其余 context index bullet 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入这句 wording
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexLeadLine**：`[CONTEXT INDEX]` 的首句说明文本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[CONTEXT INDEX]` 第一行可见 `usually sufficient to understand past work`
- **SC-002**：compaction context 不出现这句 wording
