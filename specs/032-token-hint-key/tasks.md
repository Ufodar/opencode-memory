# Tasks: Token Hint Key

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/032-token-hint-key/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - header 解释 Read / Work 的含义 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `[TOKEN KEY]` 失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，增加 token key builder
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，在 system header 注入 token key
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入 token key (Priority: P2)

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加不出现 `[TOKEN KEY]` 的断言

### Implementation for User Story 2

- [x] T007 [US2] 保持 compaction context 不变，仅通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [x] T008 运行 `bun test`
- [x] T009 运行 `bun run typecheck`
- [x] T010 运行 `bun run build`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
