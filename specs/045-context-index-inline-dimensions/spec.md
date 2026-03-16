# 功能规格：Context Index Inline Dimensions

**Feature Branch**: `[045-context-index-inline-dimensions]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 第一行已经会说：

- `This semantic index is a recent working index.`

但和 `claude-mem` 同位置对照后，当前还缺一处可见 wording：

- `claude-mem` 会把 index 的维度直接写进同一句

所以这份规格只解决一个问题：

**把 `[CONTEXT INDEX]` 第一行从只有 semantic index，推进成“semantic index + inline 维度提示”的写法。**

本轮保持保守：

- 不改 trust line
- 不改 coverage line
- 不改 drilldown bullets
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 economics / footer
- 不改 compaction context 边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 在首句暴露 index 维度 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 第一行时，我希望它第一眼就知道：

- 这是一份 semantic index
- 它覆盖哪些维度

**为什么这个优先级最高**：这是 `claude-mem` 同位置还领先我们的一条可见 wording，不是新能力，只是第一句更完整。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证第一行包含括号里的维度。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `[CONTEXT INDEX]` 第一行应包含 inline 维度提示。

### 用户故事 2 - compaction context 继续不带这句 wording (Priority: P2)

当 compaction context 生成时，我不希望 system header wording 的变化污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现这句 inline 维度 wording。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现这句 inline 维度 wording。

## 边界情况

- 只改 system context 第一行
- 不能顺手改 trust line 或 coverage line
- compaction context 继续不引入这句

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 第一行必须包含 inline 维度提示
- **FR-002**：inline 维度必须基于当前系统实际暴露的维度表述
- **FR-003**：其余 context index bullet 不得被本轮顺手改写
- **FR-004**：compaction context 不得引入这句 wording
- **FR-005**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexLeadLine**：`[CONTEXT INDEX]` 的首句说明文本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[CONTEXT INDEX]` 第一行可见 inline 维度提示
- **SC-002**：compaction context 不出现这句 wording
