# Quickstart: Context Work Economics

## 目标

让 system context 的 `[CONTEXT ECONOMICS]` 从“只有数量”变成“数量 + loading/work/savings 估算”。

## 验证命令

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts
bun test tests/runtime/compaction-context.test.ts
bun run typecheck
bun run build
```

## 关键观察点

- system context 中出现：
  - `Loading:`
  - `Work investment:`
  - `Your savings:`
- compaction context 继续不出现 `[CONTEXT ECONOMICS]`
