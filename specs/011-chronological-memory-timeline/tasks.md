# Tasks: Chronological Memory Timeline

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/011-chronological-memory-timeline/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system timeline 按时间混排 checkpoint (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 observation 比 summary 更早时应先显示 observation 的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 summary 比 observation 更早时应先显示 summary 的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，按统一 checkpoint 列表做时间排序
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction timeline 也按时间混排 (Priority: P2)

### Tests for User Story 2

- [x] T005 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加交错时间顺序下的 timeline 顺序断言

### Implementation for User Story 2

- [x] T006 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，让 compaction timeline 复用同一套时间排序
- [x] T007 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T008 运行 `bun run typecheck`
- [x] T009 运行 `bun run build`
- [x] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
