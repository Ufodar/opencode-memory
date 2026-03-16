# Quickstart: Request Aware Summary Checkpoints

## 目标

验证 summary checkpoint 已经能带 request 语义，而不是只保留 outcome。

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts`
   - `bun test tests/runtime/compaction-context.test.ts`
2. 确认 timeline 中出现：
   - `[summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md`
3. 再运行：
   - `bun run typecheck`
   - `bun run build`
