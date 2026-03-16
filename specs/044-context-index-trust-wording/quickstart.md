# Quickstart: Context Index Trust Wording

1. 运行 system context 测试，先确认新断言失败：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 修改 `[CONTEXT INDEX]` 的 trust line，使其包含 `past decisions and learnings`
3. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
