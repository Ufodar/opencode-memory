# 功能规格：Loading Line Record Count

**Feature Branch**: `[057-loading-line-record-count]`  
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

- 我们的 `Loading` 只写了 token
- `claude-mem` 同位置还会直接说这次加载了多少条记录

这份规格只解决一个问题：

**让 `Loading` 行直接带出本次 index 中可见记录数。**

本轮保持保守：

- 不改 counts line
- 不改 `Work investment`
- 不改 `Your savings`
- 不改 compaction context

## 用户场景与测试

### 用户故事 1 - Loading 行直接显示记录数 (Priority: P1) 🎯 MVP

当模型看到 `[CONTEXT ECONOMICS]` 时，我希望 `Loading` 行本身就能告诉它当前 index 实际加载了多少条记录，而不是只给 token。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `Loading` 行包含 `N records`。

## 需求

### 功能需求

- **FR-001**：`Loading` 行必须包含本次可见记录数
- **FR-002**：本次可见记录数 = `summaries + direct observations`
- **FR-003**：counts line、`Work investment`、`Your savings`、compaction context 不得被本轮改掉

## 成功标准

- **SC-001**：有 summary + direct observation 时，`Loading` 行显示合计记录数
- **SC-002**：只有 direct observation 时，`Loading` 行仍显示正确记录数
