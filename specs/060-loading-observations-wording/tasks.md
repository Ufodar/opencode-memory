# Tasks: Loading Observations Wording

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/060-loading-observations-wording/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - loading 数量单位对齐 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 为 `Loading` 行新增 `observations` 断言
- [x] T002 [US1] 运行 targeted tests，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，把 `Loading` 数量单位改成 `observations`
- [x] T004 [US1] 运行 targeted tests

## Phase 2: Regression & Documentation

- [x] T005 运行 `bun run typecheck`
- [x] T006 运行 `bun run build`
- [x] T007 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T008 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T009 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T010 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
