# Quickstart：Project Header Wording

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认有项目名时出现：
   - `# [demo-project] recent context, ...`
3. 确认无项目名时出现：
   - `# recent context, ...`
4. 确认 compaction context 不出现：
   - `recent context,`
5. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
