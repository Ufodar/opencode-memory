# Quickstart：Timeline Key Detail Lines

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认 system context 中出现：
   - `- [summary]: summary checkpoint marker`
   - `- [research/planning/execution/verification/decision]: phase label`
   - `- {tool}: source tool tag`
   - `- [day]: day grouping line`
   - `- [file]: file grouping line`
3. 确认 compaction context 不出现：
   - `summary checkpoint marker`
   - `day grouping line`
4. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
