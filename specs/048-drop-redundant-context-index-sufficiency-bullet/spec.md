# 功能规格：Drop Redundant Context Index Sufficiency Bullet

**Feature Branch**: `[048-drop-redundant-context-index-sufficiency-bullet]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经有：

- 首句直接说明 semantic index 的维度
- 首句直接说明这份 index 通常已经足够理解 past work

但和 `claude-mem` 同位置对照后，当前还多一条可见冗余：

- `- Usually enough to continue work; drill down only for evidence, implementation detail, or prior rationale.`

因为 sufficiency 已经在首句里出现，所以这份规格只解决一个问题：

**移除 `[CONTEXT INDEX]` 里重复表达 sufficiency 的 bullet。**

本轮保持保守：

- 不改首句
- 不改 trust line
- 不改 drilldown bullets
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 economics / footer
- 不改 compaction context 边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 去掉重复 sufficiency bullet (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它看到的是更紧的 header，而不是首句和下一行重复说“这份 index 通常够用”。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证首句仍在，但 `Usually enough to continue work...` 不再出现。

### 用户故事 2 - compaction context 继续不受影响 (Priority: P2)

当 compaction context 生成时，我不希望 system header 的删减污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现这条 bullet。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 中不得再出现 `Usually enough to continue work; drill down only for evidence, implementation detail, or prior rationale.`
- **FR-002**：首句、trust line、drilldown bullets 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入这条 bullet
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexSufficiencyBullet**：`[CONTEXT INDEX]` 中重复表达“通常够用”的独立 bullet。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中不再出现这条 sufficiency bullet
- **SC-002**：首句仍保留 `semantic index + sufficiency wording`
- **SC-003**：compaction context 继续不出现这条 bullet
