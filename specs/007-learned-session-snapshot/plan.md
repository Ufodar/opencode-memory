# Implementation Plan: Learned Session Snapshot

**Branch**: `[007-learned-session-snapshot]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/007-learned-session-snapshot/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/007-learned-session-snapshot/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/007-learned-session-snapshot/spec.md`

## Summary

这一轮不改 worker，不改数据库，不加 tool。

只解决一个真实 context builder 缺口：

**让 latest snapshot 除了 `Current Focus / Completed / Next` 之外，还能基于 covered observation 给出一条 `Learned`。**

技术策略是：

- 不新增数据库字段
- 只复用 latest summary 的 `observationIDs`
- 在 system / compaction 构建时，额外取回 latest summary 覆盖的 observations
- 从中编译出一条 deterministic `Learned`

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
- 不破坏 `006` 的 latest-summary 去重纪律
- 不发散到 retrieval / embedding / vector  

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 latest snapshot 的字段成熟度。
- 是否新增额外模型依赖：否
- 是否继续保持 deterministic-first：是
- 是否继续保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/007-learned-session-snapshot/
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
├── memory/
│   └── contracts.ts
├── services/
│   └── memory-worker-service.ts
├── runtime/
│   └── injection/
│       ├── curated-context-text.ts
│       ├── compiled-context.ts
│       └── compaction-context.ts
└── storage/
    └── sqlite/
        └── memory-store.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

## Phase 0 Research Decisions

1. `Learned` 只基于 latest summary 覆盖的 observation  
2. 不从 unsummarized timeline 里猜 `Learned`  
3. system / compaction 共享同一套 learned 编译规则
