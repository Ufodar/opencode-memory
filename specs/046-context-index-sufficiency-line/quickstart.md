# Quickstart: Context Index Sufficiency Line

## 目标

验证 system context 的 `[CONTEXT INDEX]` 首句现在直接表达：

- 这是 semantic index
- 它通常已经足够理解 past work

同时确保 compaction context 继续不带这句 wording。

## 步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认：
   - system context 首句包含 `usually sufficient to understand past work`
   - compaction context 不包含这句 wording
3. 回归：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
