# Quickstart: Reorder Context Index Trust Line

## 目标

验证 system context 的 `[CONTEXT INDEX]` 中：

- trust line 出现在 drilldown tools 之后
- wording 不变

同时确保 compaction context 继续不带这条 trust line。

## 步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认：
   - `Trust this index over re-reading code for past decisions and learnings.` 出现在 `Search history...` 后面
   - compaction context 不出现这句
3. 回归：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
