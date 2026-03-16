# Quickstart：Memory Search Guidance

## 目标

让 system context 中的 `[CONTEXT INDEX]` 更明确说明 `memory_search` 的用途。

## 验收步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认 system context 含有更具体的 `memory_search` 用途说明
3. 确认 compaction context 不含这条说明
4. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
