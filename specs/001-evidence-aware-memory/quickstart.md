# Quickstart: Evidence-Aware Memory

## 目标

验证 observation 新增的 evidence 字段已经真正进入：

- detail
- timeline
- context

## 1. 运行测试

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test
bun run typecheck
bun run build
```

## 2. 重点验证 detail

确认：

- `memory_details` 返回的 observation detail 中，能看到：
  - `workingDirectory`
  - `filesRead`
  - `filesModified`
  - `command`

## 3. 重点验证 timeline

确认：

- `memory_timeline` 返回的 observation item，不再只剩摘要字段
- 至少能看到最小必要 evidence 视图

## 4. 重点验证 context

确认：

- system / compaction context 会在 budget 允许时带出简短 evidence hint
- 不会退化成原始 payload dump

## 5. 真实宿主 smoke

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control
```

确认：

- 主闭环仍然通过
- report 中没有出现新的 regression
