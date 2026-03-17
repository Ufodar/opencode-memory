# Research: Vector Memory Search

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/SearchOrchestrator.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/strategies/ChromaSearchStrategy.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/strategies/HybridSearchStrategy.ts`

关键点：

- `claude-mem` 的 query text 路径已经走向量检索
- SQLite 继续保留结构化过滤与 hydration
- 最终形态是 hybrid search，而不是单纯把向量结果直接吐给模型

## 当前 `opencode-memory` 状态

当前文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/memory-store.ts`

当前 `memory_search` 只有：

- SQLite
- `LIKE`
- summary-first 排序 / 去重

这说明：

- 向量化第一刀应该落在 retrieval service
- 不需要推倒 worker、summary、context builder

## 参考 `opencode-mem` 的可复用思路

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-mem/src/services/embedding.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-mem/src/services/vector-backends/backend-factory.ts`

关键点：

- embedding 可以走 OpenAI-compatible `/embeddings`
- 向量后端优先 `USearch`
- 不可用时回退 `exact-scan`

## 本轮采取的保守策略

这轮不做：

- Chroma
- providerRef
- `timeline/details` 向量化
- 旧数据全量回填

这轮只做：

- embedding API 配置
- vector index 抽象
- `USearch` + `exact-scan`
- observation / summary 新写入向量化
- `memory_search` semantic retrieval + SQLite fallback

## 真实本地环境确认

已验证本地 OpenAI-compatible 入口可用：

- base URL: `http://192.168.5.10:3002/v1`
- embedding model:
  - `Qwen3-embedding`
  - `bge-m3`

已通过真实请求确认：

- `Qwen3-embedding` 返回向量长度 `4096`

这意味着：

- 第一刀可以直接用真实本地 embedding API 做集成验证
- `OPENCODE_MEMORY_EMBEDDING_DIMENSIONS` 第一版可默认设为 `4096`
