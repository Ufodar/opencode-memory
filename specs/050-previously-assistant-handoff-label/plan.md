# Implementation Plan: Previously Assistant Handoff Label

**Branch**: `[050-previously-assistant-handoff-label]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/050-previously-assistant-handoff-label/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/050-previously-assistant-handoff-label/spec.md`

## Summary

对照 `claude-mem` 的 `Previously` section，把 `opencode-memory` 的 `[PREVIOUSLY]` line 从普通 bullet 改成显式 assistant handoff，增加 `A:` 前缀；其余 section 不动。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 `PREVIOUSLY` 文本格式）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只改一条 handoff line，不新增查询  
**Constraints**: 不改 `[PREVIOUSLY]` section 名、不改 handoff 主体文本、不改 snapshot/timeline/footer、不改 schema、不改 worker runtime  
**Scale/Scope**: 单一 `PREVIOUSLY` assistant label 对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/050-previously-assistant-handoff-label/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── runtime/
    └── injection/
        ├── compiled-context.ts
        └── curated-context-text.ts

tests/
└── runtime/
    └── system-context.test.ts
```

**Structure Decision**: 只调 `[PREVIOUSLY]` line 的展示格式；不引入新 section，也不改 compaction。

## Complexity Tracking

本轮无额外复杂度豁免。
