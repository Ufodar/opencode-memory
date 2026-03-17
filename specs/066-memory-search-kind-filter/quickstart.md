# Quickstart：Memory Search Kind Filter

## 目标

验证 `memory_search` 可以显式只查 `summary` 或只查 `observation`，并保持当前 hybrid merge 行为。

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/services/memory-worker-service.test.ts tests/tools/retrieval-tools.test.ts
bun run typecheck
bun run build
```

## 关注点

- `kind=summary` 是否过滤掉 observation
- `kind=observation` 是否过滤掉 summary
- 未指定 `kind` 是否保持不变
