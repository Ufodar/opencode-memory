# Tasks: Memory Search Kind Filter

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/066-memory-search-kind-filter/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: Tool surface and worker filter (Priority: P1) 🎯 MVP

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/tools/retrieval-tools.test.ts` 增加 `memory_search(kind=summary)` 的失败测试
- [x] T002 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加 `kinds=[observation]` 的失败测试
- [x] T003 [US1][US2] 运行 `bun test tests/tools/retrieval-tools.test.ts tests/services/memory-worker-service.test.ts`，确认先失败
- [x] T004 [US1][US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/tools/memory-search.ts`
- [x] T005 [US1][US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`
- [x] T006 [US1][US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/contracts.ts`
- [x] T007 [US1][US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts`
- [x] T008 [US1][US2] 重新运行 targeted tests

## Phase 2: Regression & docs

- [x] T009 运行 `bun test tests/services/memory-worker-service.test.ts tests/tools/retrieval-tools.test.ts`
- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
