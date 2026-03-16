# Implementation Plan: Request Aware Summary Checkpoints

**Branch**: `[009-request-aware-summary-checkpoints]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/009-request-aware-summary-checkpoints/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/009-request-aware-summary-checkpoints/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/009-request-aware-summary-checkpoints/spec.md`

## Summary

这一轮不改 worker，不改数据库 schema，不加新 tool。

只解决一个真实 context builder 缺口：

**让 summary checkpoint 不再只有 outcome，而是也带 request 语义。**

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
- 不破坏 `008` 的 unified timeline 纪律
- 不发散到 retrieval / embedding / vector

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 summary checkpoint 的信息密度。
- 是否新增额外模型依赖：否
- 是否继续保持 deterministic-first：是
- 是否继续保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/009-request-aware-summary-checkpoints/
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
└── runtime/
    └── injection/
        ├── curated-context-text.ts
        ├── compiled-context.ts
        └── compaction-context.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

## Phase 0 Research Decisions

1. summary checkpoint 优先显示 `requestSummary + outcomeSummary`
2. requestSummary 缺失时回退 outcome-only
3. 继续保持统一 timeline，不恢复单独 `[MEMORY SUMMARY]`
