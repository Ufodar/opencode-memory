# Quickstart：Split Context Tool Lines

## 目标

让 system context 中 `[CONTEXT INDEX]` 的三种 memory 工具说明在预算足够时拆成独立 bullet。

## 验收步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认正常预算的 system context 出现三条独立工具说明
3. 确认低预算 system context 仍通过预算测试
4. 确认 compaction context 不带这些说明
5. 再运行：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
