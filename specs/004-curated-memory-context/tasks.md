# Tasks: Curated Memory Context

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/004-curated-memory-context/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - `MEMORY SUMMARY` 更像阶段摘要 (Priority: P1) 🎯 MVP

**Goal**: 让 `[MEMORY SUMMARY]` 优先呈现短的阶段结论，而不是长串 `outcomeSummary` 摘抄。

**Independent Test**: 仅调用 `buildSystemMemoryContext()`，就能验证 summary line 已明显更短、更像阶段结果。

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加长 `outcomeSummary` 被编译成短 summary line、且重复 line 会被去重的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction summary line 也使用短摘要的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，为 summary line 增加 deterministic curation 与去重
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，让 compaction summary line 复用同一套短摘要规则
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

**Checkpoint**: system / compaction 的 summary line 已不再是长串摘抄

---

## Phase 2: User Story 2 - `MEMORY TIMELINE` 更像短 checkpoint (Priority: P2)

**Goal**: 让 timeline item 保留 phase / evidence，但 observation 正文显著更短。

**Independent Test**: 仅构造 observation 输入，就能验证 timeline line 已变成短 checkpoint。

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加长 observation 被编译成短 timeline item 的断言
- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction observation line 也被压短的断言

### Implementation for User Story 2

- [x] T008 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，为 observation timeline line 增加 deterministic curation
- [x] T009 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，对 compaction observation line 复用同一套短 checkpoint 规则
- [x] T010 [US2] 运行 `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`

**Checkpoint**: timeline 已更像恢复索引，而不是 observation 长句堆叠

---

## Phase 3: User Story 3 - `RESUME GUIDE` 更动作化 (Priority: P3)

**Goal**: 让 `RESUME GUIDE` 优先给下一步动作，而不是重复长 summary。

**Independent Test**: 仅通过 system context 测试，就能验证 resume guide 优先使用短 action hint。

### Tests for User Story 3

- [x] T011 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `RESUME GUIDE` 优先使用短动作提示的断言

### Implementation for User Story 3

- [x] T012 [US3] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 `RESUME GUIDE` 优先使用短 action hint
- [x] T013 [US3] 运行 `bun test tests/runtime/system-context.test.ts`

**Checkpoint**: `RESUME GUIDE` 已更像“现在接着做什么”

---

## Phase 4: Regression & Host Validation

- [x] T014 运行 `bun test`
- [x] T015 运行 `bun run typecheck`
- [x] T016 运行 `bun run build`
- [x] T017 运行 `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control`
- [x] T018 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T019 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T020 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T021 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T022 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

## Dependencies & Execution Order

- 先做 Phase 1，因为当前最直接的问题就是 `MEMORY SUMMARY` 太像长串摘抄
- Phase 2 依赖 Phase 1，因为 timeline 应与 summary 保持一致的编译风格
- Phase 3 最后收 `RESUME GUIDE`
- Phase 4 做统一回归

## Implementation Strategy

### MVP First

1. 先把 summary line 收短
2. 再把 timeline line 收成短 checkpoint
3. 最后让 resume guide 变成动作提示
4. 再用真实宿主 preview 验证整体质感

### 为什么这样排

- 当前真实宿主里最刺眼的是 `MEMORY SUMMARY`
- 如果 summary 先不收短，resume 和 timeline 再怎么调，也仍然会显得像摘抄系统
