# Quickstart：Token Key Detail Lines

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认 system context 中出现：
   - `- Read: cost to read this memory now`
   - `- Work: past work tokens already spent to produce it`
3. 确认 compaction context 不出现：
   - `cost to read this memory now`
   - `past work tokens already spent to produce it`
4. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
