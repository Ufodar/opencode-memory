# Tasks: Context Value Footer

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/024-context-value-footer/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 结尾给出一句价值总结 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 value footer 的失败断言
- [ ] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [ ] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 footer 文本辅助函数
- [ ] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 system context 渲染这条 footer
- [ ] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入这条 footer (Priority: P2)

### Tests for User Story 2

- [ ] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 固化 compaction 不出现 value footer 的断言

### Implementation for User Story 2

- [ ] T007 [US2] 确认 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts` 保持当前轻量策略
- [ ] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [ ] T009 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
