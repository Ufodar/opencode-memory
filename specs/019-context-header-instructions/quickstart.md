# Quickstart: Context Header Instructions

## 目标

让 system context 头部增加 `[CONTEXT INDEX]` section，用更接近 `claude-mem` 的方式告诉模型：

- 这份 memory index 通常已经够继续工作
- 什么时候才需要继续调用更细的 memory tools

## 验证

运行：

```bash
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
bun run typecheck
bun run build
```

## 预期

- `buildSystemMemoryContext()` 输出包含 `[CONTEXT INDEX]`
- 其中出现“通常够继续工作”和“何时再下钻”的说明
- `buildCompactionMemoryContext()` 不包含 `[CONTEXT INDEX]`
