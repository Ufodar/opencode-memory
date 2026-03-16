# Quickstart: Expanded Key Observations

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

在 system context 或 compaction context 中，最新关键 observation 应该表现为：

```text
[MEMORY TIMELINE]
[file] requirements.csv
- [10:32] [research] 读取 requirements.csv 并发现 evidence_source 列缺失
  Result: evidence_source 列缺失
  Tool: read
```

而较旧 observation 仍保持单行。
