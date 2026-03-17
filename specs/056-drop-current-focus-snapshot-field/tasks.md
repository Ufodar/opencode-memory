# Tasks: Drop Current Focus Snapshot Field

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/056-drop-current-focus-snapshot-field/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - latest snapshot 字段对齐 `claude-mem` (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 去掉 `Current Focus:` 断言，并改为验证 snapshot 不再包含该字段
- [ ] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 去掉 `Current Focus:` 断言，并改为验证 snapshot 不再包含该字段
- [ ] T003 [US1] 运行 targeted tests，确认新断言先失败

### Implementation for User Story 1

- [ ] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，让 latest snapshot 不再生成 `Current Focus`
- [ ] T005 [US1] 运行 targeted tests

## Phase 2: User Story 2 - timeline `Next:` 不回归 (Priority: P2)

### Tests for User Story 2

- [ ] T006 [US2] 保持 system/compaction 测试中 timeline summary child line 的 `Next:` 断言

### Implementation for User Story 2

- [ ] T007 [US2] 不改 timeline rendering，只通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [ ] T008 运行 `bun test`
- [ ] T009 运行 `bun run typecheck`
- [ ] T010 运行 `bun run build`
- [ ] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
