# Tasks: Deduplicated Latest Summary Context

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/006-deduplicated-latest-summary-context/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 不再重复 latest summary (Priority: P1) 🎯 MVP

**Goal**: latest summary 已经进入 snapshot 后，`MEMORY SUMMARY` 只显示更早的 summaries。

**Independent Test**: 仅调用 `buildSystemMemoryContext()`，就能验证 latest snapshot 与 `MEMORY SUMMARY` 去重规则。

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加“只有 1 条 latest summary 时不再显示重复 `MEMORY SUMMARY`”的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加“有 2 条 summaries 时只显示更早 summary”的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 latest snapshot 与 summary section 去重
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction 也不再重复 latest summary (Priority: P2)

**Goal**: compaction context 和 system context 保持同一套 latest-summary 去重纪律。

**Independent Test**: 仅调用 `buildCompactionMemoryContext()`，就能验证 latest snapshot 与 `Recent memory summaries:` 去重。

### Tests for User Story 2

- [x] T005 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加“只有 1 条 latest summary 时不再显示重复 summary section”的断言
- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加“有 2 条 summaries 时 compaction 只显示更早 summary”的断言

### Implementation for User Story 2

- [x] T007 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，让 latest snapshot 与 compaction summary section 去重
- [x] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T009 运行 `bun test`
- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
