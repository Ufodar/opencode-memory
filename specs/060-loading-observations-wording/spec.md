# 功能规格：Loading Observations Wording

**Feature Branch**: `[060-loading-observations-wording]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT ECONOMICS]` 已经有：

- counts line
- `Loading`
- `Work investment`
- `Your savings`

但和 `claude-mem` 同位置对照后，当前还剩一处可见差距：

- 我们的 `Loading` 行还写成 `records`
- `claude-mem` 同位置写成 `observations`

这份规格只解决一个问题：

**把 `Loading` 行的数量单位从 `records` 改成 `observations`。**

本轮保持保守：

- 不改 counts line
- 不改 `Work investment`
- 不改 `Your savings`
- 不改 compaction context

## 用户场景与测试

### 用户故事 1 - loading 数量单位对齐 (Priority: P1) 🎯 MVP

当模型看到 `[CONTEXT ECONOMICS]` 时，我希望 `Loading` 行的数量单位和 `claude-mem` 同位置一致，明确成 `observations`。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `Loading` 行包含 `observations`。

## 需求

### 功能需求

- **FR-001**：`Loading` 行必须使用 `observations` 作为数量单位
- **FR-002**：counts line、`Work investment`、`Your savings`、compaction context 不得被本轮改掉

## 成功标准

- **SC-001**：system context 的 `Loading` 行包含 `observations`
