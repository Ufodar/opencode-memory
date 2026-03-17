# Tasks: Semantic Memory Timeline

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/062-semantic-memory-timeline/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - query 语义 observation anchor (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [ ] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加“query timeline 优先使用 semantic observation anchor”的失败测试
- [ ] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/tools/retrieval-tools.test.ts` 增加 `memory_timeline` query 路径仍返回 observation anchor 的断言
- [ ] T003 [US1] 运行 targeted tests，确认新断言先失败

### Implementation for User Story 1

- [ ] T004 [US1] 扩展 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/vector/search-service.ts`，支持 observation-only semantic retrieval
- [ ] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`，让 query-based `getMemoryTimeline` 优先走 semantic observation anchor resolution
- [ ] T006 [US1] 如有需要，调整 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/worker/server.ts` 或相关 worker 接线，保持 timeline response 结构不变
- [ ] T007 [US1] 运行 targeted tests

## Phase 2: User Story 2 - semantic timeline query 回退 (Priority: P2)

### Tests for User Story 2

- [ ] T008 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加“semantic query 无 observation 命中时回退文本 timeline”的失败测试
- [ ] T009 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加“scope 继续遵守 session -> project fallback”的失败测试
- [ ] T010 [US2] 运行 targeted tests，确认先失败

### Implementation for User Story 2

- [ ] T011 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts` 补 semantic/query/text fallback 编排
- [ ] T012 [US2] 运行 targeted tests

## Phase 3: User Story 3 - 显式 anchor 不受影响 (Priority: P3)

### Tests for User Story 3

- [ ] T013 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 增加“显式 anchor 优先于 semantic query”的失败测试
- [ ] T014 [US3] 运行 targeted tests，确认先失败

### Implementation for User Story 3

- [ ] T015 [US3] 修正 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts` 的优先级顺序，确保显式 anchor 不回归
- [ ] T016 [US3] 运行 targeted tests

## Phase 4: Regression & Documentation

- [ ] T017 运行 `bun run typecheck`
- [ ] T018 运行 `bun run build`
- [ ] T019 运行相关 `bun test` targeted suite
- [ ] T020 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [ ] T021 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [ ] T022 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [ ] T023 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [ ] T024 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
