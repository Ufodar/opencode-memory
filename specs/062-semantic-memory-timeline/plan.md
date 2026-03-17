# Implementation Plan: Semantic Memory Timeline

**Branch**: `[062-semantic-memory-timeline]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/062-semantic-memory-timeline/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/062-semantic-memory-timeline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

对照 `claude-mem` 的 timeline query 层，给 `memory_timeline(query=...)` 增加第一版 semantic anchor resolution。实现方式保持保守：优先在 worker service 中用 semantic observation search 解析 anchor，再复用现有 `store.getMemoryTimeline(anchorID=...)` 构建时间线；如果 semantic path 不可用或无命中，则回退到当前文本 query 路径。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`bun:sqlite`、`usearch`  
**Storage**: SQLite + 本地 vector index  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime + local memory worker  
**Project Type**: library/plugin  
**Performance Goals**: 在不破坏现有 timeline 可用性的前提下，补上 query -> semantic observation anchor -> timeline 主链  
**Constraints**: 只扩 `memory_timeline(query=...)`；不改 `memory_search` 结果面、不改 `memory_details`、不改 context builder  
**Scale/Scope**: 仅覆盖 query-based timeline；显式 `anchor` 路径保持原样

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 继续沿 `claude-mem` 主线，只补 timeline query 层差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 这轮不扩展到 `memory_details`、context builder、providerRef 或更重的 hybrid retrieval

## Project Structure

### Documentation (this feature)

```text
specs/062-semantic-memory-timeline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── services/
│   └── memory-worker-service.ts
├── memory/
│   └── vector/
├── storage/
│   └── sqlite/
└── worker/

tests/
├── services/
├── storage/
└── tools/
```

**Structure Decision**: 继续复用现有 worker + SQLite + vector 架构；把 query-based semantic anchor resolution 放在 `memory-worker-service`，避免改动 store 的时间线编排主体。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
