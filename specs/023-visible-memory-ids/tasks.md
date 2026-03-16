# Tasks: Visible Memory IDs

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/023-visible-memory-ids/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 直接暴露可见 record ID (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 summary / observation 可见 ID 的失败断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `memory_details` 指引与可见 ID 对齐的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 ID 展示格式辅助函数
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 summary / observation line 显示 ID
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 不必强制暴露 ID (Priority: P2)

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 固化 compaction 当前不要求显示 ID 的断言

### Implementation for User Story 2

- [x] T007 [US2] 确认 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts` 保持当前轻量策略
- [x] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T009 运行 `bun run typecheck`
- [x] T010 运行 `bun run build`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
