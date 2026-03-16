# Quickstart：Context Drilldown Intro

## 目标

让 system context 中 `[CONTEXT INDEX]` 的工具说明前多一条短导语，说明“需要更细上下文时再用这些工具”。

## 验收步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认 system context 在工具说明前出现新导语
3. 确认 compaction context 不带这条导语
4. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
