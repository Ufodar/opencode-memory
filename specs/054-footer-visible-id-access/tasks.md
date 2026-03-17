# Tasks: Footer Visible ID Access

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/054-footer-visible-id-access/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - footer 最后一行更明确说明 visible IDs 的用途 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 footer 最后一行 phrasing 的失败断言
- [ ] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [ ] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，把最后一句改成 `use memory_details with visible IDs to access deeper memory before re-reading history`
- [ ] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - access line wording 不回归 (Priority: P2)

### Tests for User Story 2

- [ ] T005 [US2] 保持 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 中 `past research, building, and decisions` 的断言

### Implementation for User Story 2

- [ ] T006 [US2] 不改 access line 逻辑，只通过回归测试确认没有污染

## Phase 3: Regression & Documentation

- [x] T007 运行 `bun test`
- [x] T008 运行 `bun run typecheck`
- [x] T009 运行 `bun run build`
- [ ] T010 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T012 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T013 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
