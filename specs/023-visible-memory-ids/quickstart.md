# Quickstart: Visible Memory IDs

## 目标

验证 system context 中是否已经直接出现 summary / observation 的 ID，并确认 compaction context 不强制跟进。

## 步骤

1. 运行 system / compaction 测试：

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

- system context 中出现 `#sum_*` / `#obs_*`
- compaction context 保持当前轻量输出
