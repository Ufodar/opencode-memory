# Implementation Plan: Memory Search Kind Filter

**Branch**: `[066-memory-search-kind-filter]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/066-memory-search-kind-filter/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/066-memory-search-kind-filter/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/066-memory-search-kind-filter/spec.md`

## Summary

这轮在 `memory_search` tool 上增加最小 `kind` 过滤：支持 `summary` / `observation`，并让 worker、text retrieval、semantic retrieval 三层都遵守同一过滤。保持当前 hybrid merge、summary-first 与 session-first / project-fallback 不变。

## Technical Context

**Language/Version**: TypeScript / Bun  
**Primary Dependencies**: `@opencode-ai/plugin`, `bun:sqlite`, `usearch`  
**Storage**: SQLite + 本地向量索引  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin + external memory worker  
**Project Type**: plugin + worker service  
**Performance Goals**: 不增加新的外部 round-trip；保持当前 worker 查询路径  
**Constraints**: 不改 timeline/details/context builder；只扩 memory_search 参数面  
**Scale/Scope**: 仅影响 `memory_search` 的过滤能力

## Constitution Check

- 保持单 feature、单层收口：通过
- 不新增外部服务：通过
- 先写失败测试：必须执行
- 必须先对照 `claude-mem` 同层 search type：通过

## Project Structure

### Documentation (this feature)

```text
specs/066-memory-search-kind-filter/
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
│   └── contracts.ts
└── storage/
    └── sqlite/
        └── retrieval-query-service.ts

tests/
├── services/
│   └── memory-worker-service.test.ts
└── tools/
    └── retrieval-tools.test.ts
```

**Structure Decision**: 用最小修改打通 tool arg -> worker -> text/semantic retrieval 三层，不扩展到 timeline/details。
