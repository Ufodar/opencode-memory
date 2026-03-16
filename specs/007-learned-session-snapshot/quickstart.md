# Quickstart: Learned Session Snapshot

## 目标

验证 latest snapshot 可以基于 covered observation 额外显示一条 `Learned`。

## 步骤

1. 运行 system context 测试

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts
```

2. 运行 compaction context 测试

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/compaction-context.test.ts
```

3. 跑全量验证

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test
bun run typecheck
bun run build
```

## 预期

- latest snapshot 新增：
  - `Learned: ...`
- 这条 `Learned` 来自 latest summary 覆盖的 observation
- 没有 covered observation 时，不强行伪造 `Learned`
