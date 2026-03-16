# Tasks: Quantified Context Value

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/028-quantified-context-value/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context footer 给出量化后的价值句 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `[CONTEXT VALUE]` 量化句失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，让 `[CONTEXT VALUE]` 接收 economics estimate 并输出量化句
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，把 economics estimate 传给 `[CONTEXT VALUE]`
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - 小样本场景仍保留原泛化 footer (Priority: P2)

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加小样本场景断言

### Implementation for User Story 2

- [x] T007 [US2] 调整 `[CONTEXT VALUE]` 输出策略，确保原泛化 footer 不被量化句替代
- [x] T008 [US2] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T009 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
- [x] T010 运行 `bun test`
- [x] T011 运行 `bun run typecheck`
- [x] T012 运行 `bun run build`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
