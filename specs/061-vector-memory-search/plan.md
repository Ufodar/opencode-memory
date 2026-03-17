# Implementation Plan: Vector Memory Search

**Branch**: `[061-vector-memory-search]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/061-vector-memory-search/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/061-vector-memory-search/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

对照 `claude-mem` 的 search 层，给 `memory_search` 增加第一版 semantic retrieval。实现方式采用 OpenAI-compatible embedding API + 本地 vector index，优先 `USearch`，失败回退 `exact-scan`，并继续保留当前 SQLite 文本检索作为兜底。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`bun:sqlite`、`usearch`  
**Storage**: SQLite + 本地 vector index 文件 / in-memory cache  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime + local worker  
**Project Type**: library/plugin  
**Performance Goals**: 在不破坏当前 `memory_search` 可用性的前提下补 semantic retrieval  
**Constraints**: 只扩 `memory_search`，不改 timeline/details/context builder 主结构  
**Scale/Scope**: 向量化第一刀，仅覆盖 observation / summary -> memory_search

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 继续沿 `claude-mem` 主线，只补 search 层差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 这轮不扩展到 timeline/details/providerRef/Chroma

## Project Structure

### Documentation (this feature)

```text
specs/061-vector-memory-search/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── memory/
│   └── vector/
├── services/
│   └── ai/
├── storage/
│   └── sqlite/
└── worker/

tests/
├── services/
│   └── ai/
├── storage/
│   └── vector/
└── worker/
```

**Structure Decision**: 在现有 worker + SQLite 架构上新增 embedding service、vector index 与 retrieval 编排，不引入新的外部服务。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
