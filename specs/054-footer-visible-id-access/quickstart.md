# Quickstart: Footer Visible ID Access

1. 运行 `bun test tests/runtime/system-context.test.ts`
2. 确认 `[CONTEXT VALUE]` 最后一行现在要求 `use memory_details with visible IDs to access deeper memory before re-reading history`
3. 实现最小改动
4. 重新运行 targeted tests
5. 运行 `bun test && bun run typecheck && bun run build`
