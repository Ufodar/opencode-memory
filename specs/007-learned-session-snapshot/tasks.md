# Tasks: Learned Session Snapshot

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/007-learned-session-snapshot/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system snapshot 显示 Learned (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 latest snapshot 读取 covered observation 并显示 `Learned` 的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加“没有 covered observation 时不显示 `Learned`”的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/contracts.ts`，为 injection 层补足按 ID 读取 observation 的最小接口
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`，在构建 latest snapshot 时取回 covered observations
- [x] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 `Learned` 编译 helper
- [x] T006 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，渲染 `Learned`
- [x] T007 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction snapshot 也显示 Learned (Priority: P2)

### Tests for User Story 2

- [x] T008 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction snapshot 显示 `Learned` 的断言

### Implementation for User Story 2

- [x] T009 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，渲染 `Learned`
- [x] T010 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T011 运行 `bun test`
- [x] T012 运行 `bun run typecheck`
- [x] T013 运行 `bun run build`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T018 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
