# Quickstart: Context Index Inline Dimensions

1. 运行 system context 测试，先确认新断言失败：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 修改 `[CONTEXT INDEX]` 第一行 wording，使其包含 inline 维度提示
3. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
