# 功能规格：Semantic Context Index Wording

**Feature Branch**: `[043-semantic-context-index-wording]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- `This memory snapshot is a recent working index.`
- `Covers summaries, phases, tools, files, and tokens.`

但和 `claude-mem` 同位置对照后，当前还缺一处明确 wording：

- `claude-mem` 会直接把这段叫成 `semantic index`

所以这份规格只解决一个问题：

**把 `[CONTEXT INDEX]` 的第一句从一般性的 working index wording，推进成更接近 `claude-mem` 的 semantic index wording。**

本轮保持保守：

- 不改 drilldown bullets
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 `[CONTEXT ECONOMICS]`
- 不改 footer
- 不改 compaction context 的边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 明确这是 semantic index (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它第一眼就知道：

- 这不是普通提示词段落
- 这是 semantic index

**为什么这个优先级最高**：这是 `claude-mem` 同位置还领先我们的一条可见 wording，不是新能力，只是定位更准。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[CONTEXT INDEX]` 第一行包含 `semantic index`。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `[CONTEXT INDEX]` 第一行应明确包含 `semantic index`。

### 用户故事 2 - compaction context 继续不带这段 wording (Priority: P2)

当 compaction context 生成时，我不希望 system header wording 的变化污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现 `semantic index` 这条 system wording。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `semantic index`。

## 边界情况

- 只改 system context 的第一句 wording
- 不能顺手改别的 guide bullet
- compaction context 继续不引入这句

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 第一行必须明确包含 `semantic index`
- **FR-002**：已有的 coverage 和 drilldown guidance 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入这句 wording
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexLeadLine**：`[CONTEXT INDEX]` 的第一句说明文本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[CONTEXT INDEX]` 第一行可见 `semantic index`
- **SC-002**：compaction context 不出现这句 wording
