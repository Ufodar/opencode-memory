# 功能规格：Reorder Context Index Trust Line

**Feature Branch**: `[049-reorder-context-index-trust-line]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 内容已经基本对齐：

- 首句包含 semantic index + inline 维度 + sufficiency
- 覆盖 line 和重复 sufficiency bullet 都已经移除

但和 `claude-mem` 同位置对照后，当前还剩一处可见顺序差距：

- 我们现在先放 `Trust this index...`
- `claude-mem` 是先给 drilldown tools，再放 trust line

所以这份规格只解决一个问题：

**把 `[CONTEXT INDEX]` 里的 trust line 移到 drilldown 工具说明之后。**

本轮保持保守：

- 不改首句
- 不改 trust line wording
- 不改 detailed search bullets wording
- 不改 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 economics / footer
- 不改 compaction context 边界
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 里的 trust line 改到 tools 后面 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望先看到“如何下钻”，再看到“默认应该先相信 index”，这样阅读顺序更接近 `claude-mem`。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `Trust this index...` 出现在 `Search history...` 后面。

### 用户故事 2 - compaction context 继续不受影响 (Priority: P2)

当 compaction context 生成时，我不希望 system header 顺序变化污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现 trust line。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 中，trust line 必须出现在 detailed search bullets 之后
- **FR-002**：首句、trust line wording、detailed search bullets wording 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入 trust line
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexTrustLine**：`[CONTEXT INDEX]` 中的 `Trust this index over re-reading code for past decisions and learnings.`

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 trust line 出现在 detailed search bullets 之后
- **SC-002**：trust line wording 不变
- **SC-003**：compaction context 继续不出现 trust line
