# 功能规格：Savings Reduction From Reuse

**Feature Branch**: `[059-savings-reduction-from-reuse]`  
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

- 我们的 `Your savings` 百分比还写成 `reuse reduction`
- `claude-mem` 同位置写成 `reduction from reuse`

这份规格只解决一个问题：

**把 `Your savings` 行的百分比 phrasing 改成 `reduction from reuse`。**

本轮保持保守：

- 不改 counts line
- 不改 `Loading`
- 不改 `Work investment`
- 不改 compaction context

## 用户场景与测试

### 用户故事 1 - savings 百分比 phrasing 对齐 (Priority: P1) 🎯 MVP

当模型看到 `[CONTEXT ECONOMICS]` 时，我希望 `Your savings` 里的百分比表达和 `claude-mem` 同位置一致，明确成 `reduction from reuse`。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `Your savings` 行包含 `reduction from reuse`。

## 需求

### 功能需求

- **FR-001**：`Your savings` 行必须使用 `reduction from reuse` phrasing
- **FR-002**：counts line、`Loading`、`Work investment`、compaction context 不得被本轮改掉

## 成功标准

- **SC-001**：system context 的 `Your savings` 行包含 `reduction from reuse`
