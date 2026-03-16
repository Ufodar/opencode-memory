# Implementation Plan: Structured Memory Context

**Branch**: `[002-structured-memory-context]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/002-structured-memory-context/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/002-structured-memory-context/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/002-structured-memory-context/spec.md`

## Summary

这一轮不改数据库，也不新增工具。  
只把当前平铺的 system memory context 编译成更结构化的三段输出：

1. `MEMORY SUMMARY`
2. `MEMORY TIMELINE`
3. `RESUME GUIDE`

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`、真实 OpenCode host smoke  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**: 输出更结构化，但不破坏现有 budget discipline  
**Constraints**:
- 不新增 schema
- 不新增模型调用
- 不复制 `claude-mem` 的完整 terminal 输出
- 不破坏当前 summary-first discipline

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是
- 是否发散到 embedding / vector：否
- 是否维持可验证闭环：是
- 是否仍保持本地优先与现有 runtime：是

## Implementation Phases

### Phase 1：Compiled Sections

目标：
- 给 system context 新增 section 编译层

### Phase 2：Resume Guide

目标：
- 用 deterministic 规则生成短恢复提示

### Phase 3：Preview Alignment

目标：
- `memory_context_preview` 与真实注入输出一致

### Phase 4：Regression

目标：
- 保证 budget 和真实宿主 smoke 继续通过
