# Quickstart: Vector Memory Search

## 目标

给 `memory_search` 增加第一版 semantic retrieval：

- embedding API
- local vector index
- SQLite fallback

## 环境变量

```bash
export OPENCODE_MEMORY_EMBEDDING_API_URL="http://192.168.5.10:3002/v1"
export OPENCODE_MEMORY_EMBEDDING_API_KEY="..."
export OPENCODE_MEMORY_EMBEDDING_MODEL="Qwen3-embedding"
export OPENCODE_MEMORY_EMBEDDING_DIMENSIONS="4096"
export OPENCODE_MEMORY_VECTOR_BACKEND="usearch"
```

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/services/ai/embedding-config.test.ts
bun test tests/storage/vector/vector-search.test.ts
bun run typecheck
bun run build
```

## 真实集成验证

至少验证三件事：

1. `Qwen3-embedding` 能返回 `4096` 维向量
2. 新 observation / summary 写入后能进入 vector index
3. `memory_search` 在无字面匹配时仍能召回语义相近记录
