# Tasks: Vector Memory Search

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/061-vector-memory-search/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - `memory_search` 具备语义召回 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/services/ai/embedding-config.test.ts` 为 `OPENCODE_MEMORY_EMBEDDING_*` 配置解析增加失败测试
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/storage/vector/vector-search.test.ts` 增加“语义相近但不字面匹配也能命中”的失败测试
- [x] T003 [US1] 运行 targeted tests，确认新断言先失败

### Implementation for User Story 1

- [x] T004 [US1] 新增 embedding config / client，实现 OpenAI-compatible `/embeddings` 调用
- [x] T005 [US1] 新增 vector index 抽象与 `USearchVectorIndex`
- [x] T006 [US1] 新增 `ExactScanVectorIndex` 作为 fallback
- [x] T007 [US1] 扩展 SQLite schema / repository，使 observation 与 summary 写入后可同步向量化
- [x] T008 [US1] 修改 retrieval service，让 `memory_search` 优先尝试 semantic retrieval，再保留 summary-first 结果组织
- [x] T009 [US1] 运行 targeted tests

## Phase 2: User Story 2 - semantic retrieval 失败时自动回退 (Priority: P2)

### Tests for User Story 2

- [x] T010 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/storage/vector/vector-search.test.ts` 增加“未配置 embedding 时回退 SQLite 文本检索”的失败测试
- [x] T011 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/storage/vector/vector-search.test.ts` 增加“向量后端不可用时回退文本检索”的失败测试
- [x] T012 [US2] 运行 targeted tests，确认先失败

### Implementation for User Story 2

- [x] T013 [US2] 在 worker / retrieval 编排里补 semantic retrieval fallback
- [x] T014 [US2] 补错误处理与维度校验
- [x] T015 [US2] 运行 targeted tests

## Phase 3: User Story 3 - 真实 Qwen embedding 验证 (Priority: P3)

### Tests / Verification for User Story 3

- [x] T016 [US3] 用真实 `Qwen3-embedding` 配置执行最小 embedding 请求，记录返回维度
- [x] T017 [US3] 在本地 worker/store 路径里做一次真实 `memory_search` 集成验证

### Implementation for User Story 3

- [x] T018 [US3] 若真实验证暴露配置或维度问题，做最小修复

## Phase 4: Regression & Documentation

- [x] T019 运行 `bun run typecheck`
- [x] T020 运行 `bun run build`
- [x] T021 运行相关 `bun test` targeted suite
- [x] T022 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T023 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T024 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T025 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T026 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
