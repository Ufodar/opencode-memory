# Quickstart: Inline Observation Type Tags

## 目标

让折叠的 observation timeline 行也能直接暴露工具类型，而不是只有展开 detail 行才显示 `Tool: ...`。

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
bun test
bun run typecheck
bun run build
```
