# Quickstart: Multi Expanded Observations

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
[MEMORY TIMELINE]
[file] brief.txt
- [09:41] [research] 读取 brief.txt 并确认 smoke 目标
  Tool: read
[file] checklist.md
- [09:43] [verification] 读取 checklist.md 并确认 smoke 步骤
  Tool: read
- [09:45] [execution] 写入 questions.md 并生成缺口清单初稿
```

上面的含义是：
- 最近两条 observation 会展开
- 更旧 observation 继续保持单行
