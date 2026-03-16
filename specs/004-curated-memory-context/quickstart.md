# Quickstart: Curated Memory Context

## 1. 跑针对性测试

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

目标：
- 先证明 context builder 的裁剪规则变了
- 不先跑全量，避免回归定位太慢

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

## 4. 查看真实 preview

重点看：

- `/Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke/*run5-preview.jsonl`
- `/Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke/*report.md`

判断标准：

- `MEMORY SUMMARY` 不再是一整条长串摘抄
- `MEMORY TIMELINE` 每行更像短 checkpoint
- `RESUME GUIDE` 更像下一步动作提示
