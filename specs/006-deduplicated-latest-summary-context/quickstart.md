# Quickstart: Deduplicated Latest Summary Context

## 目标

验证 latest summary 已经被 snapshot 吸收后，不再在 summary section 重复出现。

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

- 当只有 1 条 latest summary 时：
  - preview 有 `[LATEST SESSION SNAPSHOT]`
  - 不再有重复的 `MEMORY SUMMARY`

- 当有 2 条 summaries 时：
  - snapshot 只代表最新一条
  - `MEMORY SUMMARY` / `Recent memory summaries:` 只显示更早的一条
