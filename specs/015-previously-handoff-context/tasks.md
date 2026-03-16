# Tasks: Previously Handoff Context

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/015-previously-handoff-context/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 带上上一条 assistant 交接文本 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `priorAssistantMessage` 存在时输出 `[PREVIOUSLY]` 的失败断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加没有 `priorAssistantMessage` 时不输出 `[PREVIOUSLY]` 的断言
- [x] T003 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/tools/retrieval-tools.test.ts` 增加 preview 透传 `Previously` 的失败断言

### Implementation for User Story 1

- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增上一条 assistant 文本的整理函数
- [x] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，在 system context 末尾渲染 `[PREVIOUSLY]`
- [x] T006 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/system-context.ts`，接受 `priorAssistantMessage`
- [x] T007 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - plugin 侧读取上一条 assistant 文本并透传给 worker (Priority: P2)

### Tests for User Story 2

- [x] T008 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/tools/retrieval-tools.test.ts` 覆盖 preview 调 worker 时会带上 `priorAssistantMessage`
- [x] T009 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/context-injection-handlers.test.ts` 覆盖 handler 会把上一条 assistant 文本交给 worker

### Implementation for User Story 2

- [x] T010 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/index.ts`，把 OpenCode `client` 接入 system transform 与 preview 依赖
- [x] T011 [US2] 新增 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/read-last-assistant-message.ts`，封装读取上一条 assistant 文本的逻辑
- [x] T012 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/handlers/system-transform.ts`，在调用 worker 前读取并传入 `priorAssistantMessage`
- [x] T013 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/tools/memory-context-preview.ts`，让 preview 走同一条读取逻辑
- [x] T014 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts` 与 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/worker/protocol.ts`，让 `buildSystemContext` 支持可选 `priorAssistantMessage`
- [x] T015 [US2] 运行 `bun test tests/tools/retrieval-tools.test.ts`

## Phase 3: Regression & Documentation

- [x] T016 运行 `bun run typecheck`
- [x] T017 运行 `bun run build`
- [x] T018 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T019 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T020 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T021 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T022 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
