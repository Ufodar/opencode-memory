# 功能规格：Work Investment Spent Phrasing

**Feature Branch**: `[058-work-investment-spent-phrasing]`  
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

- 我们的 `Work investment` 还写成 `captured from prior work`
- `claude-mem` 同位置明确写成 `spent on research, building, and decisions`

这份规格只解决一个问题：

**把 `Work investment` 行的 wording 改成更接近 `claude-mem` 的 work-spent 表达。**

本轮保持保守：

- 不改 counts line
- 不改 `Loading`
- 不改 `Your savings`
- 不改 compaction context

## 用户场景与测试

### 用户故事 1 - Work investment 行表达过去投入 (Priority: P1) 🎯 MVP

当模型看到 `[CONTEXT ECONOMICS]` 时，我希望 `Work investment` 行直接表达这些 token 是过去在 research / building / deciding 上已经花掉的投入，而不是较弱的 “captured from prior work”。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `Work investment` 行包含 `spent on research, building, and decisions`。

## 需求

### 功能需求

- **FR-001**：`Work investment` 行必须使用 `spent on research, building, and decisions` 语义
- **FR-002**：counts line、`Loading`、`Your savings`、compaction context 不得被本轮改掉

## 成功标准

- **SC-001**：system context 的 `Work investment` 行包含新的 spent phrasing
