# Tasks: Nonredundant File Grouped Timeline

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/014-nonredundant-file-grouped-timeline/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system timeline 去掉被文件分组覆盖的 files hint (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `[file]` 存在时不再重复显示 `(files: ...)` 的断言

### Implementation for User Story 1

- [x] T002 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 system timeline 去掉被文件分组覆盖的 `files:` hint
- [x] T003 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction timeline 也去掉重复 files hint (Priority: P2)

### Tests for User Story 2

- [x] T004 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction 中 `[file]` 存在时不再重复显示 `(files: ...)` 的断言

### Implementation for User Story 2

- [x] T005 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，让 compaction timeline 复用同一套去重规则
- [x] T006 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T007 运行 `bun run typecheck`
- [x] T008 运行 `bun run build`
- [x] T009 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
