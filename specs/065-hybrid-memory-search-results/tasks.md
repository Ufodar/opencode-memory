# Tasks: Hybrid Memory Search Results

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/065-hybrid-memory-search-results/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: Hybrid merge within a scope (Priority: P1) 🎯 MVP

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加 session scope 合并 semantic + text 的失败测试
- [ ] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加 project fallback 下混合结果的失败测试
- [ ] T003 [US1] 运行 `bun test tests/services/memory-worker-service.test.ts`，确认先失败
- [ ] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`
- [ ] T005 [US1] 重新运行 `bun test tests/services/memory-worker-service.test.ts`

## Phase 2: Dedupe and ordering (Priority: P1)

- [ ] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加 semantic/text 双命中去重的失败测试
- [ ] T007 [US2] 运行 targeted tests，确认先失败
- [ ] T008 [US2] 完善 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`
- [ ] T009 [US2] 重新运行 targeted tests

## Phase 3: Regression & docs

- [ ] T010 运行 `bun test tests/services/memory-worker-service.test.ts tests/tools/retrieval-tools.test.ts`
- [ ] T011 运行 `bun run typecheck`
- [ ] T012 运行 `bun run build`
- [ ] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T016 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T017 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
