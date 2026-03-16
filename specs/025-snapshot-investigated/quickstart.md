# Quickstart：Snapshot Investigated

1. 先运行 snapshot 相关测试，确认 `Investigated` 断言先失败  
   `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 实现 latest snapshot 的 `Investigated` 编译逻辑
3. 再运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
   - `bun run typecheck`
   - `bun run build`
