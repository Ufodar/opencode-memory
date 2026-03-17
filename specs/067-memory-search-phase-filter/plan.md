# Implementation Plan: Memory Search Phase Filter

**Branch**: `[067-memory-search-phase-filter]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/067-memory-search-phase-filter/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/067-memory-search-phase-filter/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/067-memory-search-phase-filter/spec.md`

## Summary

这轮给 `memory_search` 增加最小 `phase` 过滤，并让 tool、worker、text retrieval、semantic retrieval 四层都遵守它。因为 phase 只存在于 observation，所以一旦指定 `phase`，结果面默认就是 observation-only。

## Technical Context

**Language/Version**: TypeScript / Bun  
**Primary Dependencies**: `@opencode-ai/plugin`, `bun:sqlite`, `usearch`  
**Storage**: SQLite + 本地向量索引  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin + external memory worker  
**Project Type**: plugin + worker service  
**Performance Goals**: 不增加新的外部 round-trip  
**Constraints**: 不改 timeline/details/context builder；只扩 memory_search 参数面  
**Scale/Scope**: 仅影响 `memory_search` 的 observation metadata filter

## Constitution Check

- 保持单 feature、单层收口：通过
- phase 复用现有 observation 数据，不引入新持久化字段：通过
- 必须先写失败测试：通过
- 必须先对照 `claude-mem` 同层 metadata filter：通过

## Project Structure

### Documentation (this feature)

```text
specs/067-memory-search-phase-filter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── tools/
│   └── memory-search.ts
├── services/
│   └── memory-worker-service.ts
├── memory/
│   ├── contracts.ts
│   └── observation/
│       └── types.ts
└── storage/
    └── sqlite/
        └── retrieval-query-service.ts

tests/
├── services/
│   └── memory-worker-service.test.ts
├── tools/
│   └── retrieval-tools.test.ts
└── storage/
    └── retrieval-surface.test.ts
```

**Structure Decision**: 仍然走最小参数链扩展，不新增模块，只把 `phase` 从 tool surface 穿到 worker 与 text/semantic retrieval。
