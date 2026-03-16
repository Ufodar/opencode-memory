# Tasks: Timestamped Memory Timeline Checkpoints

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/010-timestamped-memory-timeline-checkpoints/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system timeline 的 checkpoint 带短时间标记 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 summary checkpoint 带短时间前缀的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 observation checkpoint 带短时间前缀的断言
- [x] T003 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 synthetic 小整数时间戳回退无时间前缀的断言

### Implementation for User Story 1

- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增短时间前缀 helper
- [x] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 system timeline checkpoint 使用短时间前缀
- [x] T006 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction timeline 的 checkpoint 也带短时间标记 (Priority: P2)

### Tests for User Story 2

- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 summary / observation checkpoint 带短时间前缀的断言

### Implementation for User Story 2

- [x] T008 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，让 compaction timeline checkpoint 使用短时间前缀
- [x] T009 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
