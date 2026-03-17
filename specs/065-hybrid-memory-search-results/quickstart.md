# Quickstart：Hybrid Memory Search Results

## 目标

验证 `memory_search` 在同一 scope 下可以合并 semantic 与 text 命中，并保持去重与 summary-first。

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/services/memory-worker-service.test.ts tests/tools/retrieval-tools.test.ts
bun run typecheck
bun run build
```

## 关注点

- session semantic + session text 是否合并
- session 为空时 project semantic + project text 是否合并
- 同一个 `kind + id` 是否去重
- summary 是否仍然排在 observation 前面
