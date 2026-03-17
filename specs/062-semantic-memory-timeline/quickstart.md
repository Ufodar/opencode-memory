# Quickstart: Semantic Memory Timeline

## 目标

验证 `memory_timeline(query=...)` 已经能优先使用 semantic observation anchor，而不是只靠文本匹配。

## 步骤 1：跑 targeted tests

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/services/memory-worker-service.test.ts tests/storage/vector/sqlite-semantic-search.test.ts tests/tools/retrieval-tools.test.ts
```

## 步骤 2：类型检查与构建

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run typecheck
bun run build
```

## 步骤 3：人工验证 query timeline 行为

1. 写入一条语义上与 query 相近、但不字面匹配的 observation
2. 调用 `memory_timeline(query=...)`
3. 确认：
   - anchor 是 observation，不是 summary
   - timeline 围绕该 observation 展开
   - 语义 search 不可用时，仍能回退到当前文本路径
