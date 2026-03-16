# Tasks: Split Context Tool Lines

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/037-split-context-tool-lines/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 里的工具说明更易读 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加三种工具说明分行的失败断言
- [x] T002 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`，确认新断言先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，在正常预算下拆分三条工具说明
- [x] T004 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: User Story 2 - 低预算场景继续使用压缩版 (Priority: P2)

### Tests for User Story 2

- [x] T005 [US2] 复用已有预算测试，确认低预算场景仍然通过

### Implementation for User Story 2

- [x] T006 [US2] 在 system context 渲染中加入预算判断，低预算时回退单行压缩版

## Phase 3: User Story 3 - compaction context 继续不带这些说明 (Priority: P2)

### Tests for User Story 3

- [x] T007 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加不出现分行工具说明的断言

### Implementation for User Story 3

- [x] T008 [US3] 保持 compaction context 不引入这些说明，只通过回归测试确认没有污染

## Phase 4: Regression & Documentation

- [x] T009 运行 `bun test`
- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
