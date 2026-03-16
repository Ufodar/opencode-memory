# Quickstart: Fielded Session Snapshot

## 1. 跑针对性测试

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

目标：
- 先证明 latest summary 快照已经出现
- 再看是否破坏现有 curated summary / timeline / resume

## 2. 跑全量验证

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test
bun run typecheck
bun run build
```

## 3. 跑真实宿主 smoke

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control
```

## 4. 在同一 session 里手动预览

重点看：

- `memory_context_preview`

判断标准：

- 能一眼看出最近一轮在做什么
- 能一眼看出已经完成了什么
- 能一眼看出接下来做什么
