# Tasks: Snapshot Investigated

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/025-snapshot-investigated/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 的 latest snapshot 显示 `Investigated` (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `Investigated` 的失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/evidence-hints.ts` 或相关 helper，提取稳定 investigation 线索
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 `Investigated` 字段编译逻辑
- [x] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，把 `Investigated` 注入 latest snapshot
- [x] T006 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction snapshot 复用同样的 `Investigated` 字段 (Priority: P2)

### Tests for User Story 2

- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 `Investigated` 断言

### Implementation for User Story 2

- [x] T008 [US2] 确认 compaction latest snapshot 复用相同字段构建逻辑
- [x] T009 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T010 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
- [x] T011 运行 `bun run typecheck`
- [x] T012 运行 `bun run build`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
