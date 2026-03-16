# Tasks: Context Index Trust Guidance

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/035-context-index-trust-guidance/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - context index 明确提示先信当前 index (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 trust guidance 的失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，为 `[CONTEXT INDEX]` 增加 trust guidance
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: User Story 2 - compaction context 继续不带这条说明 (Priority: P2)

### Tests for User Story 2

- [x] T005 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加不出现 trust guidance 的断言

### Implementation for User Story 2

- [x] T006 [US2] 保持 compaction context 不引入这条说明，只通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [x] T007 运行 `bun test`
- [x] T008 运行 `bun run typecheck`
- [x] T009 运行 `bun run build`
- [x] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
