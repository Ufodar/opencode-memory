# Implementation Plan: Hybrid Memory Search Results

**Branch**: `[065-hybrid-memory-search-results]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/065-hybrid-memory-search-results/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/065-hybrid-memory-search-results/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/065-hybrid-memory-search-results/spec.md`

## Summary

当前 `memory_search` 的语义召回已经存在，但同一 scope 下还是“semantic 优先，text 只做 fallback”。这轮在 `memory-worker-service` 里引入最小 hybrid merge：同一 scope 下同时拉取 semantic 与 text 结果，按 `kind + id` 去重，再按现有 summary-first 纪律返回；只有 session 混合结果为空时，才继续回退到 project scope。

## Technical Context

**Language/Version**: TypeScript / Bun  
**Primary Dependencies**: `@opencode-ai/plugin`, `bun:sqlite`, `usearch`  
**Storage**: SQLite + 本地向量索引  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin + external memory worker  
**Project Type**: plugin + worker service  
**Performance Goals**: 不增加新的外部 round-trip；仍保持当前 worker 查询路径  
**Constraints**: 不改 tool surface；不改 timeline/details/context builder；保持 session-first / project-fallback  
**Scale/Scope**: 仅影响 `memory_search` 的结果编排

## Constitution Check

- 保持单 feature、单层收口：通过
- 不新增外部服务：通过
- 先写失败测试：必须执行
- 不在没有 `claude-mem` 对照的情况下发散：通过

## Project Structure

### Documentation (this feature)

```text
specs/065-hybrid-memory-search-results/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── services/
│   └── memory-worker-service.ts
└── memory/
    └── contracts.ts

tests/
├── services/
│   └── memory-worker-service.test.ts
└── tools/
    └── retrieval-tools.test.ts
```

**Structure Decision**: 这轮不扩展新模块，直接在 `memory-worker-service` 收口 hybrid merge 逻辑，并用现有 retrieval tests 覆盖行为变化。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无 | - | - |
