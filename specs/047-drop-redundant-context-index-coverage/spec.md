# 功能规格：Drop Redundant Context Index Coverage

**Feature Branch**: `[047-drop-redundant-context-index-coverage]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经有：

- 首句直接写出 semantic index 的维度
- 首句直接表达这份 index 通常已足够理解 past work

但和 `claude-mem` 同位置对照后，当前还多一条可见冗余：

- `- Covers summaries, phases, tools, files, and tokens.`

因为这些维度已经在首句里出现，所以这份规格只解决一个问题：

**移除 `[CONTEXT INDEX]` 里的重复 coverage bullet。**

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

### 用户故事 1 - system context 去掉重复 coverage line (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望看到的是更紧的 header，而不是首句和下一行重复说同一件事。

**为什么这个优先级最高**：这是 `claude-mem` 同位置还领先我们的一条可见简化，不是新能力，只是去掉冗余。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证首句仍在，但 `Covers summaries, phases, tools, files, and tokens.` 不再出现。

### 用户故事 2 - compaction context 继续不受影响 (Priority: P2)

当 compaction context 生成时，我不希望 system header 的删减污染压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 继续不出现 coverage line。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT INDEX]` 中不得再出现 `Covers summaries, phases, tools, files, and tokens.`
- **FR-002**：首句、trust line、drilldown bullets 不得被本轮顺手改写
- **FR-003**：compaction context 不得引入这条 coverage line
- **FR-004**：本轮不得修改 `[TIMELINE KEY]`、`[TOKEN KEY]`、economics、footer、schema、worker runtime

### 关键实体

- **ContextIndexCoverageLine**：`[CONTEXT INDEX]` 里重复描述维度的独立 bullet。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中不再出现 coverage line
- **SC-002**：首句保留 `semantic index + sufficiency wording`
- **SC-003**：compaction context 继续不出现这条 coverage line
