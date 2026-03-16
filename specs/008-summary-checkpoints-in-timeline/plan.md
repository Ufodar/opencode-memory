# Implementation Plan: Summary Checkpoints In Timeline

**Branch**: `[008-summary-checkpoints-in-timeline]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/008-summary-checkpoints-in-timeline/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/008-summary-checkpoints-in-timeline/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/008-summary-checkpoints-in-timeline/spec.md`

## Summary

这一轮不改 worker，不改数据库 schema，不加新 tool。

只解决一个真实 context builder 缺口：

**让 older summaries 不再单独待在 `[MEMORY SUMMARY]`，而是像 `claude-mem` 一样进入 `[MEMORY TIMELINE]`，作为 summary checkpoint 展示。**

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite、本地独立 worker  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Constraints**:
- 不改数据库 schema
- 不新增模型调用
- 不破坏 `005` / `006` / `007` 的 snapshot 纪律
- 不发散到 retrieval / embedding / vector

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 timeline 是否能承载 summary checkpoint。
- 是否新增额外模型依赖：否
- 是否继续保持 deterministic-first：是
- 是否继续保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/008-summary-checkpoints-in-timeline/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
src/
├── runtime/
│   └── injection/
│       ├── compiled-context.ts
│       ├── curated-context-text.ts
│       ├── system-context.ts
│       └── compaction-context.ts
└── memory/
    └── contracts.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

## Phase 0 Research Decisions

1. latest summary 继续只待在 `[LATEST SESSION SNAPSHOT]`
2. only older summaries 进入 `[MEMORY TIMELINE]`
3. older summaries 一旦进入 timeline，单独的 `[MEMORY SUMMARY]` section 就不再保留
4. summary checkpoint 只显示短 outcome，必要时补一行短 `Next`
