# Quickstart：Action-Led Context Tool Lines

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认 system context 中出现：
   - `Fetch by ID: memory_details(visible IDs) for record detail`
   - `Expand a checkpoint window: memory_timeline(checkpoint)`
   - `Search history: memory_search(decisions, bugs, deeper research)`
3. 确认 compaction context 不出现：
   - `Fetch by ID:`
   - `Expand a checkpoint window:`
   - `Search history:`
4. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
