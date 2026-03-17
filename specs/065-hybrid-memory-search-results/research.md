# 研究：Hybrid Memory Search Results

## `claude-mem` 对照

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/strategies/HybridSearchStrategy.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/strategies/HybridSearchStrategy.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/SearchOrchestrator.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/SearchOrchestrator.ts)

当前最值得吸收的不是完整的 Chroma/SQLite 双后端结构，而是同层原则：

1. 不把 semantic 命中当成唯一结果面
2. 语义与结构化/文本证据应一起进入编排
3. fallback 仍然保留，但不该过早截断

## 当前 `opencode-memory` 状态

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/vector/search-service.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/vector/search-service.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts)

当前问题很具体：

- session scope 下，只要 semantic 有结果，就直接返回，不再并入 text 命中
- project scope 也是同样逻辑
- 所以 text 命中的 summary / observation 会被 semantic 路径完全遮住

## 本轮保守策略

- 不做复杂 reranking
- 不改 vector search service 返回结构
- 先在 worker service 做最小 merge + dedupe
- 用现有 `summary-first` 纪律作为最终排序约束
