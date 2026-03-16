# Tasks: Project Header Wording

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/040-project-header-wording/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 的 freshness 行改成标题式 wording (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加标题式 freshness wording 的失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，把 freshness 行改成标题式 wording
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: User Story 2 - compaction context 继续不带这条标题式 wording (Priority: P2)

### Tests for User Story 2

- [x] T005 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加不出现 `recent context,` 的断言

### Implementation for User Story 2

- [x] T006 [US2] 保持 compaction context 不引入这条 wording，只通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [ ] T007 运行 `bun test`
- [ ] T008 运行 `bun run typecheck`
- [ ] T009 运行 `bun run build`
- [ ] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T012 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T013 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
