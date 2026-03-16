# Tasks: Evidence-Aware Memory

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/001-evidence-aware-memory/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - observation detail 证据对齐 (Priority: P1) 🎯 MVP

**Goal**: `memory_details` 不再只是返回摘要级 observation detail，而是稳定返回结构化 evidence。

**Independent Test**: 仅调用 `memory_details`，就能验证 observation detail 是否带出 `workingDirectory / filesRead / filesModified / command`。

### Tests for User Story 1

- [x] T001 [US1] 在 `tests/tools/retrieval-tools.test.ts` 增加 detail 返回 evidence 字段的断言
- [x] T002 [US1] 在 `tests/storage/retrieval-surface.test.ts` 增加 summary detail 的 `coveredObservations` 也保留 evidence 的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `src/memory/contracts.ts`，明确 `MemoryObservationDetailRecord` 的 evidence 结构
- [x] T004 [US1] 修改 `src/storage/sqlite/mappers.ts`，让 observation detail 映射完整暴露 evidence
- [x] T005 [US1] 修改 `src/storage/sqlite/retrieval-query-service.ts`，确保 summary detail 的 `coveredObservations` 不丢 evidence
- [x] T006 [US1] 跑 `bun test tests/tools/retrieval-tools.test.ts tests/storage/retrieval-surface.test.ts`

**Checkpoint**: `memory_details` 层证据对齐完成

---

## Phase 2: User Story 2 - timeline 证据对齐 (Priority: P2)

**Goal**: `memory_timeline` 不再只暴露摘要级 observation item，而是开始保留最小必要 evidence 视图。

**Independent Test**: 仅调用 `memory_timeline`，验证 observation item 是否带出关键 evidence 字段。

### Tests for User Story 2

- [x] T007 [US2] 在 `tests/storage/retrieval-surface.test.ts` 增加 timeline observation item evidence 断言
- [x] T008 [US2] 在 `tests/tools/retrieval-tools.test.ts` 增加 timeline tool 返回 evidence 字段的断言

### Implementation for User Story 2

- [x] T009 [US2] 修改 `src/memory/contracts.ts`，为 `MemoryTimelineItem` 的 observation 分支补充最小 evidence 视图
- [x] T010 [US2] 修改 `src/storage/sqlite/mappers.ts`，让 `mapTimelineObservationRow()` 输出 evidence 字段
- [x] T011 [US2] 修改 `src/storage/sqlite/retrieval-query-service.ts`，确保 timeline anchor 和 items 不丢 evidence
- [x] T012 [US2] 跑 `bun test tests/storage/retrieval-surface.test.ts tests/tools/retrieval-tools.test.ts`

**Checkpoint**: `memory_timeline` 层证据对齐完成

---

## Phase 3: User Story 3 - context evidence hint 对齐 (Priority: P3)

**Goal**: system / compaction context 在预算内带出短 evidence hint，而不是只带摘要。

**Independent Test**: 只看 system/compaction builder 输出，就能验证 evidence hint 是否被纳入且不超预算。

### Tests for User Story 3

- [x] T013 [US3] 在 `tests/runtime/system-context.test.ts` 增加 evidence hint 断言
- [x] T014 [US3] 在 `tests/runtime/compaction-context.test.ts` 增加 evidence hint 与 budget 断言
- [x] T015 [US3] 在 `tests/tools/retrieval-tools.test.ts` 为 `memory_context_preview` 增加 evidence hint 断言

### Implementation for User Story 3

- [x] T016 [US3] 修改 `src/runtime/injection/system-context.ts`，在 budget 内追加精简 evidence hint
- [x] T017 [US3] 修改 `src/runtime/injection/compaction-context.ts`，复用同一套 evidence hint 规则
- [x] T018 [US3] 如有必要，调整 `src/tools/memory-context-preview.ts` 的返回展示
- [x] T019 [US3] 跑 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts tests/tools/retrieval-tools.test.ts`

**Checkpoint**: 注入层证据对齐完成

---

## Phase 4: Regression & Validation

**Purpose**: 验证三条消费链增强后，主闭环仍然稳定。

- [x] T020 运行 `bun test`
- [x] T021 运行 `bun run typecheck`
- [x] T022 运行 `bun run build`
- [x] T023 运行 `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control`
- [x] T024 更新 `docs/architecture.md`
- [x] T025 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T026 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T027 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

## Dependencies & Execution Order

- Phase 1 先做，因为它是最基础的 evidence 消费面
- Phase 2 依赖 Phase 1，因为 timeline item 的 evidence 设计应与 detail 一致
- Phase 3 依赖 Phase 1 和 Phase 2，因为 evidence hint 规则要参考 detail / timeline 的最终字段
- Phase 4 最后统一做

## Implementation Strategy

### MVP First

1. 先完成 Phase 1
2. 验证 `memory_details` 已真正消化 evidence
3. 再推进 timeline
4. 最后才推进 context

### 为什么这样排

- detail 是最直接的证据出口
- timeline 是结构化上下文出口
- context 是最容易引入噪声的一层，应该最后做
