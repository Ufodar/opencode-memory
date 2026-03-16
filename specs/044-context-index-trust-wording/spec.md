# 功能规格：Context Index Trust Wording

**Feature Branch**: `[044-context-index-trust-wording]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- `Trust this index before re-reading code or past history.`

但和 `claude-mem` 同位置对照后，当前还缺一处更具体的 wording：

- `claude-mem` 会写成：
  - `Trust this index over re-reading code for past decisions and learnings`

所以这份规格只解决一个问题：

**把 trust line 从一般性的“先信 index 再读历史”，推进成更接近 `claude-mem` 的“对过去决策与学习优先信 index” wording。**

本轮保持保守：

- 不改 `[CONTEXT INDEX]` 首句
- 不改 drilldown bullets
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 economics / footer
- 不改 compaction context 边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 的 trust line 更接近 claude-mem (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它知道：

- 过去的决策与学习，应该优先信这个 index
- 而不是默认去重读代码和历史聊天

**为什么这个优先级最高**：这是 `claude-mem` 同位置还领先我们的一条可见 wording，不是新能力，只是 trust 语义更具体。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 trust line 包含 `past decisions and learnings`。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** trust line 应明确包含 `past decisions and learnings`。

### 用户故事 2 - compaction context 继续不带这句 wording (Priority: P2)

当 compaction context 生成时，我不希望 system header wording 的变化污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现这句 trust wording。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `past decisions and learnings`。

## 边界情况

- 只改 system context 的 trust line
- 不能顺手改别的 guide bullet
- compaction context 继续不引入这句

## 需求

### 功能需求

- **FR-001**：system context 的 trust line 必须明确包含 `past decisions and learnings`
- **FR-002**：其余 context index bullet 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入这句 wording
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexTrustLine**：`[CONTEXT INDEX]` 下的 trust guidance 文本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 trust line 可见 `past decisions and learnings`
- **SC-002**：compaction context 不出现这句 wording
