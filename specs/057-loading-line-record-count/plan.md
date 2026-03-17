# Implementation Plan: Loading Line Record Count

**Branch**: `[057-loading-line-record-count]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/057-loading-line-record-count/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/057-loading-line-record-count/spec.md`

## Summary

对照 `claude-mem` 的 context economics，同位置把 `Loading` 行从“只有 token”推进成“记录数 + token”；counts line 和其他 economics 行保持不变。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 economics 文本）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只改 economics 文本，不新增查询  
**Constraints**: 不改 counts line、不改 `Work investment`、不改 `Your savings`、不改 compaction context  
**Scale/Scope**: 单一 loading line 对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/057-loading-line-record-count/
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
    └── system-context.test.ts
```

**Structure Decision**: 只调整 economics loading line；compaction 不受影响。
