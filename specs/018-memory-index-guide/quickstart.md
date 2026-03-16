# Quickstart: Memory Index Guide

## 1. 运行目标测试

```bash
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

## 2. 检查类型与构建

```bash
bun run typecheck
bun run build
```

## 3. 手动验证期望输出

```text
[CONTINUITY]
This memory snapshot is a recent working index.
- Use memory_details for record-level detail
- Use memory_timeline to widen around a checkpoint
- Use memory_search for broader project lookup
```

这段 guide 只应出现在 system context，不应进入 compaction context。
