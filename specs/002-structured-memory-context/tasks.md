# Tasks: Structured Memory Context

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/002-structured-memory-context/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 从平铺列表升级为结构化 section (Priority: P1) 🎯 MVP

**Goal**: system context 至少稳定输出三段：

- `MEMORY SUMMARY`
- `MEMORY TIMELINE`
- `RESUME GUIDE`

**Independent Test**: 只看 `buildSystemMemoryContext()` 输出，就能确认 section 结构已经存在。

### Tests for User Story 1

- [x] T001 [US1] 在 `tests/runtime/system-context.test.ts` 增加 section 标题断言
- [x] T002 [US1] 在 `tests/tools/retrieval-tools.test.ts` 增加 `memory_context_preview` 返回结构化 section 行的断言

### Implementation for User Story 1

- [x] T003 [US1] 新增 `src/runtime/injection/compiled-context.ts`，编译结构化 section
- [x] T004 [US1] 修改 `src/runtime/injection/system-context.ts`，改为复用 compiled context
- [x] T005 [US1] 跑 `bun test tests/runtime/system-context.test.ts tests/tools/retrieval-tools.test.ts`

**Checkpoint**: system context 已从平铺列表升级为结构化 section

---

## Phase 2: User Story 2 - resume guide 短恢复提示 (Priority: P2)

**Goal**: 在不调用模型的前提下，追加一段短恢复提示。

**Independent Test**: 只看 system context 输出，就能确认有 deterministic resume guide。

### Tests for User Story 2

- [x] T006 [US2] 在 `tests/runtime/system-context.test.ts` 增加 resume guide 断言

### Implementation for User Story 2

- [x] T007 [US2] 修改 `src/runtime/injection/compiled-context.ts`，生成 deterministic resume guide
- [x] T008 [US2] 跑 `bun test tests/runtime/system-context.test.ts`

**Checkpoint**: system context 已包含 resume guide

---

## Phase 3: User Story 3 - preview 与真实注入对齐 (Priority: P3)

**Goal**: `memory_context_preview` 不再只是“有几行”，而是能预览和真实 system injection 一致的结构。

**Independent Test**: `memory_context_preview` 返回的行结构与 system context 测试对齐。

### Tests for User Story 3

- [x] T009 [US3] 在 `tests/tools/retrieval-tools.test.ts` 补充 preview section / guide 断言

### Implementation for User Story 3

- [x] T010 [US3] 如有必要，调整 `src/tools/memory-context-preview.ts` 的展示说明
- [x] T011 [US3] 跑 `bun test tests/tools/retrieval-tools.test.ts`

**Checkpoint**: preview 与 system injection 对齐

---

## Phase 4: Regression & Validation

- [x] T012 运行 `bun test`
- [x] T013 运行 `bun run typecheck`
- [x] T014 运行 `bun run build`
- [x] T015 运行 `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control`
- [x] T016 更新 `docs/architecture.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T018 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T019 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
