# Tasks: Context Legend

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/020-context-legend/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 头部解释 timeline 标签 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `[TIMELINE KEY]` section 的失败断言
- [ ] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `[summary] / phase / [day] / [file]` 含义的失败断言

### Implementation for User Story 1

- [ ] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 `[TIMELINE KEY]` 文本构造函数
- [ ] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，在 system context header 插入 `[TIMELINE KEY]`
- [ ] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入 legend (Priority: P2)

### Tests for User Story 2

- [ ] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction context 不包含 `[TIMELINE KEY]` 的断言

### Implementation for User Story 2

- [ ] T007 [US2] 确认 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts` 不引入 `[TIMELINE KEY]`
- [ ] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [ ] T009 运行 `bun run typecheck`
- [ ] T010 运行 `bun run build`
- [ ] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
