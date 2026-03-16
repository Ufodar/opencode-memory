# Quickstart: Project Freshness Header

## 目标

验证 system context 头部是否出现项目名和生成时间，并确认 compaction context 不受影响。

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

- system context 包含 `Project: ...`（当 `projectPath` 可推断时）
- system context 包含 `Generated: ...`
- compaction context 不包含 `Generated: ...`
