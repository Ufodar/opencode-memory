# 功能规格：Token Key Read Clarifier

**Feature Branch**: `[052-token-key-read-clarifier]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[TOKEN KEY]` 已经有：

- `Read`
- `Work`

而且上一轮已经补齐了 `Work` 的 `research / building / deciding` clarifier。

但和 `claude-mem` 同位置对照后，当前还剩一处可见说明差距：

- 我们现在的 `Read` 只说“cost to read this memory now”
- `claude-mem` 同位置还会补它是 `cost to learn it now`

所以这份规格只解决一个问题：

**给 `[TOKEN KEY]` 里的 `Read` line 加上 `cost to learn it now` 这个 clarifier。**

本轮保持保守：

- 不改 `[TOKEN KEY]` section 名
- 不改 `Work` line
- 不改 economics
- 不改 timeline / snapshot / footer
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 里的 `Read` 更明确 (Priority: P1) 🎯 MVP

当模型读到 `[TOKEN KEY]` 时，我希望它知道 `Read` 不是抽象成本，而是“现在学会这一条”的阅读成本。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[TOKEN KEY]` 的 `Read` line 包含 `(cost to learn it now)`。

### 用户故事 2 - compaction context 继续不显示 token key (Priority: P2)

当 compaction context 生成时，我不希望这轮对齐把 system-only token key 带进去。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction 继续不包含 `[TOKEN KEY]`。

## 需求

### 功能需求

- **FR-001**：system context 的 `[TOKEN KEY]` 中，`Read` line 必须带 `(cost to learn it now)` clarifier
- **FR-002**：`Work` line 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入 `[TOKEN KEY]`
- **FR-004**：本轮不得修改 economics、timeline、snapshot、footer、schema、worker runtime

### 关键实体

- **TokenKeyReadLine**：`[TOKEN KEY]` 中解释 `Read` 的那一行

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 `Read` line 包含 `(cost to learn it now)`
- **SC-002**：`Work` line 仍保持上一轮 clarifier
- **SC-003**：compaction context 继续不包含 `[TOKEN KEY]`
