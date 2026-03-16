# Tasks: Footer Drilldown Reminder

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/029-footer-drilldown-reminder/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context footer 给出下钻动作提醒 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 footer drilldown reminder 失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，让 `[CONTEXT VALUE]` 追加 `memory_details + visible ID` 下钻提醒
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入 footer 提醒 (Priority: P2)

### Tests for User Story 2

- [x] T005 [US2] 复用 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 回归验证，确认 compaction 仍不包含 `memory_details` footer 提醒

### Implementation for User Story 2

- [x] T006 [US2] 保持 compaction context 不变，仅通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [x] T007 运行 `bun test`
- [x] T008 运行 `bun run typecheck`
- [x] T009 运行 `bun run build`
- [x] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
