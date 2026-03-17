# Tasks: Language-Neutral Context Actions

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/064-language-neutral-context-actions/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: Default English fallback (Priority: P1) 🎯 MVP

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加默认英文 fallback 的失败测试
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加默认英文 fallback 的失败测试
- [x] T003 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`，确认先失败
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`
- [x] T005 [US1] 重新运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

## Phase 2: Explicit Chinese fallback policy (Priority: P2)

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加显式中文 fallback 的失败测试
- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加显式中文 fallback 的失败测试
- [x] T008 [US2] 运行 targeted tests，确认先失败
- [x] T009 [US2] 完善 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`
- [x] T010 [US2] 重新运行 targeted tests

## Phase 3: Regression & docs

- [x] T011 运行 `bun run typecheck`
- [x] T012 运行 `bun run build`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
