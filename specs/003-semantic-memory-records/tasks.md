# Tasks: Semantic Memory Records

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/003-semantic-memory-records/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - `read` observation 语义化 (Priority: P1) 🎯 MVP

**Goal**: 让 `read` observation 的 `content / output.summary` 更像文件主要内容，而不是 `read: 文件路径`。

**Independent Test**: 仅调用 `captureToolObservation()` 和 `memory_context_preview`，就能验证 `read` observation 已明显摆脱路径摘要。

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/tool-after.test.ts` 增加 `read` XML payload 被压成语义摘要的断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 preview / resume 不再退化成 `read: 文件路径` 的断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/tool-after.ts`，为 `read` 工具增加正文提取和 deterministic semantic 摘要逻辑
- [x] T004 [US1] 如有必要，新增 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/read-content-summary.ts` 一类 helper，隔离 XML 正文解析与摘要裁剪规则
- [x] T005 [US1] 运行 `bun test tests/runtime/tool-after.test.ts tests/runtime/system-context.test.ts`

**Checkpoint**: deterministic `read` observation 已从路径摘要升级为语义摘要

---

## Phase 2: User Story 2 - summary / resume 继续吃这种语义记录 (Priority: P2)

**Goal**: request summary 和 `RESUME GUIDE` 直接受益于新的 semantic observation。

**Independent Test**: 构造 request window 后生成 summary 与 system context，验证其输出不再主要是原始工具短语。

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/build-summary-record.test.ts` 增加 summary 复用 semantic observation 的断言
- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 `RESUME GUIDE` 优先引用语义 observation 的断言

### Implementation for User Story 2

- [x] T008 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/summary/aggregate.ts`，确保 `outcomeSummary` 更稳定复用 semantic observation
- [x] T009 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，让 resume guide 优先使用语义 observation / summary
- [x] T010 [US2] 运行 `bun test tests/summary/build-summary-record.test.ts tests/runtime/system-context.test.ts`

**Checkpoint**: summary 和 resume 已体现 semantic memory record

---

## Phase 3: User Story 3 - observation model 作为可选增强正式对齐 (Priority: P3)

**Goal**: observation model 有配置时增强文本质量，无配置或失败时自动回退 deterministic 结果。

**Independent Test**: 仅通过 worker service 和 observation model 单测，就能验证增强/回退两条路径都成立。

### Tests for User Story 3

- [x] T011 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/memory-worker-service.test.ts` 明确 observation model 优先级与回退行为
- [x] T012 [US3] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/observation/model-observation.test.ts` 补充输出归一化或失败回退的断言（如需要）

### Implementation for User Story 3

- [x] T013 [US3] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts`，确认 observation model 精炼后仍保留 deterministic trace/evidence
- [x] T014 [US3] 如有必要，修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/model-observation.ts` 的输出约束或归一化
- [x] T015 [US3] 运行 `bun test tests/services/memory-worker-service.test.ts tests/observation/model-observation.test.ts`

**Checkpoint**: observation model 正式成为可选增强层，而非隐藏代码路径

---

## Phase 4: Regression & Host Validation

- [x] T016 运行 `bun test`
- [x] T017 运行 `bun run typecheck`
- [x] T018 运行 `bun run build`
- [x] T019 运行 `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control`
- [x] T020 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T021 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T022 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T023 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T024 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

## Dependencies & Execution Order

- Phase 1 先做，因为这是当前真实 preview 最差的地方
- Phase 2 依赖 Phase 1，因为 summary / resume 必须吃到 semantic observation 才有意义
- Phase 3 依赖 Phase 1 和 Phase 2，因为 model observation 只是增强层
- Phase 4 最后统一验证

## Implementation Strategy

### MVP First

1. 先完成 Phase 1
2. 用 unit tests 和真实 preview 确认路径摘要问题已经明显改善
3. 再推进 Phase 2，让 summary / resume 跟上
4. 最后才把 observation model 作为可选增强收口

### 为什么这样排

- 当前最直接的问题在 `read` observation
- 如果 observation 不先变好，后面的 summary / resume 只是继续消费差文本
- model enhancement 应该锦上添花，不应该倒过来成为前提
