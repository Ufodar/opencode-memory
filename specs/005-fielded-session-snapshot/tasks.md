# Tasks: Fielded Session Snapshot

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/005-fielded-session-snapshot/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - 最新一轮工作有结构化快照 (Priority: P1) 🎯 MVP

**Goal**: 让 current memory preview 能直接显示最近一轮的 `Current Focus / Completed / Next`。

**Independent Test**: 仅调用 `buildSystemMemoryContext()`，就能验证 latest summary snapshot 已出现且字段明确。

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 latest summary 被编译成 `Current Focus / Completed / Next` 的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `nextStep` 缺失时 snapshot 仍能给出 fallback `Next` 的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 session snapshot 字段编译 helper
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，渲染 latest summary snapshot
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

**Checkpoint**: 当前会话已经能直接看到最近一轮在做什么 / 完成了什么 / 接下来做什么

---

## Phase 2: User Story 2 - compaction 也保留这份快照 (Priority: P2)

**Goal**: compaction context 和 system context 保持一致的最新工作快照视角。

**Independent Test**: 仅构造 latest summary 并调用 `buildCompactionMemoryContext()`，就能验证 snapshot 已进入 compaction。

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction 也显示 latest summary snapshot 的断言

### Implementation for User Story 2

- [x] T007 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，渲染 latest summary snapshot
- [x] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

**Checkpoint**: compaction 不再丢失最近一轮工作快照

---

## Phase 3: Regression & Host Validation

- [x] T009 运行 `bun test`
- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [ ] T012 运行 `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control`
- [x] T013 在同一 session 下手动执行 `memory_context_preview` 验证真实输出
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T017 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T018 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

## Dependencies & Execution Order

- 先做 Phase 1，因为当前真实缺口就是“最近一轮工作快照不够明确”
- 再做 Phase 2，让 compaction 跟上
- 最后做统一验证

## Implementation Strategy

### MVP First

1. 先让 system context 出现 latest summary snapshot
2. 再让 compaction 跟上
3. 最后用真实宿主 preview 验证是否真的更容易理解最近一轮工作

### 为什么这样排

- 当前与 `claude-mem` 的下一层差距已经从“长串摘抄”推进到“最近一轮工作快照不够明确”
- 先收 latest summary snapshot，能最快验证这一步是否还在主线里
