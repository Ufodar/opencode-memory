# Quickstart：Context Value Footer

1. 运行 system context 测试，确认新增 footer 断言先失败  
   `bun test tests/runtime/system-context.test.ts`
2. 实现 footer 文本生成
3. 再运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
   - `bun run typecheck`
   - `bun run build`
