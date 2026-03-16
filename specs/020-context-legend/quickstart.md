# Quickstart: Context Legend

## 目标

让 system context 头部增加 `[TIMELINE KEY]` section，用来解释：

- `[summary]`
- phase 标签
- `[day]`
- `[file]`

## 验证

```bash
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
bun run typecheck
bun run build
```

## 预期

- `buildSystemMemoryContext()` 输出包含 `[TIMELINE KEY]`
- 其中能看出各标签的语义
- `buildCompactionMemoryContext()` 不包含 `[TIMELINE KEY]`
