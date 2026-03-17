# Tasks: Language-Neutral Memory Core

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/063-language-neutral-memory-core/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: English decision signals (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/checkpoint-selection.test.ts` 增加英文 decision signal 的失败测试
- [x] T002 [US1] 运行 `bun test tests/summary/checkpoint-selection.test.ts`，确认先失败

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/phase.ts`，补中英 decision heuristics
- [x] T004 [US1] 重新运行 `bun test tests/summary/checkpoint-selection.test.ts`

## Phase 2: English retrieval-only prompt detection (Priority: P1)

### Tests for User Story 2

- [x] T005 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/chat-message.test.ts` 增加英文 retrieval-only prompt 的失败测试
- [x] T006 [US2] 运行 `bun test tests/runtime/chat-message.test.ts`，确认先失败

### Implementation for User Story 2

- [x] T007 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/chat-message.ts`，扩英文 retrieval-only 规则
- [x] T008 [US2] 重新运行 `bun test tests/runtime/chat-message.test.ts`

## Phase 3: Configurable output language (Priority: P2)

### Tests for User Story 3

- [x] T009 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/model-summary.test.ts` 增加默认英文 prompt 与中文覆盖的失败测试
- [x] T010 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/observation/model-observation.test.ts` 增加默认英文 prompt 与中文覆盖的失败测试
- [x] T011 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/model-summary.test.ts` 增加英文弱 next step 的失败测试
- [x] T012 [US3] 运行 `bun test tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts`，确认先失败

### Implementation for User Story 3

- [x] T013 [US3] 新增 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/output-language.ts`
- [x] T014 [US3] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/model-summary.ts`
- [x] T015 [US3] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/model-observation.ts`
- [x] T016 [US3] 重新运行 `bun test tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts`

## Phase 4: Regression & docs

- [x] T017 运行 `bun test tests/summary/checkpoint-selection.test.ts tests/runtime/chat-message.test.ts tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts`
- [x] T018 运行 `bun run typecheck`
- [x] T019 运行 `bun run build`
- [x] T020 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T021 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T022 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T023 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T024 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
