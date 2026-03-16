# Implementation Plan: Context Index Trust Guidance

**Branch**: `[035-context-index-trust-guidance]` | **Date**: 2026-03-16 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/035-context-index-trust-guidance/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/035-context-index-trust-guidance/spec.md`

## Summary

对照 `claude-mem` 的 Context Index 说明，在 system context header 增加一条短的 trust guidance，明确默认先信这份 index，再决定是否回读代码或历史；compaction context 保持不变。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 header 文本渲染）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只增加一条短的 header 使用原则，不新增查询  
**Constraints**: 不改 timeline、不改 footer、不改 compaction、不改 schema、不改 worker runtime  
**Scale/Scope**: 单一 Context Index 指导语增强

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/035-context-index-trust-guidance/
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
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 只改 Context Index guide lines 和 system context 的预算判断；compaction 只做回归确认。

## Complexity Tracking

本轮无额外复杂度豁免。
