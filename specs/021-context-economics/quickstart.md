# Quickstart: Context Economics

## 目标

验证 system context 头部是否出现轻量的 economics 说明，并确认 compaction context 不受影响。

## 步骤

1. 运行 system / compaction 相关测试：

```bash
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

2. 运行类型检查：

```bash
bun run typecheck
```

3. 运行构建：

```bash
bun run build
```

## 预期

- system context 包含 `[CONTEXT ECONOMICS]`
- system context 中出现 summary / direct observations / covered observations 计数
- compaction context 不包含 `[CONTEXT ECONOMICS]`
