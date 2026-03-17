# Quickstart：Memory Search Phase Filter

## 目标

验证 `memory_search` 可以显式只查某个 observation phase，并保持现有 hybrid merge 纪律。

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/tools/retrieval-tools.test.ts tests/services/memory-worker-service.test.ts tests/storage/retrieval-surface.test.ts
bun run typecheck
bun run build
```
