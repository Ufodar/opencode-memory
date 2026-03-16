# Tasks: Memory Index Guide

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/018-memory-index-guide/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 先告诉模型这份 memory index 怎么用 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 system context 开头出现 memory index guide 的失败断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 guide 提到 `memory_details / memory_timeline / memory_search` 的失败断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 memory index guide 文本构造函数
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，在 system context 头部插入 guide
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入这段 guide (Priority: P2)

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction context 不包含 guide 的断言

### Implementation for User Story 2

- [x] T007 [US2] 确认 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts` 不引入 system guide
- [x] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T009 运行 `bun run typecheck`
- [x] T010 运行 `bun run build`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
