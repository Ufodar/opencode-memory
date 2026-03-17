# Implementation Plan: Drop Current Focus Snapshot Field

**Branch**: `[056-drop-current-focus-snapshot-field]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/056-drop-current-focus-snapshot-field/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/056-drop-current-focus-snapshot-field/spec.md`

## Summary

对照 `claude-mem` summary 同位置，去掉 latest snapshot 中额外的 `Current Focus` 字段；其余 `Investigated / Learned / Completed / Next Steps` 保持不变，timeline child line 继续保持 `Next:`。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 snapshot 字段集合）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只改 snapshot 字段集合，不新增查询  
**Constraints**: 不改 timeline `Next:`、不改 snapshot 出现条件、不改 footer/context index/token key、不改 schema、不改 worker runtime  
**Scale/Scope**: 单一 snapshot 字段对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/056-drop-current-focus-snapshot-field/
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
        └── curated-context-text.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 只调整 snapshot 字段集合；timeline `Next:` 只做回归确认。

## Complexity Tracking

本轮无额外复杂度豁免。
