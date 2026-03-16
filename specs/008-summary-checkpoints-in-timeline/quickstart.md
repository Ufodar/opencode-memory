# Quickstart: Summary Checkpoints In Timeline

## 目标

验证 older summaries 已进入统一 timeline，而不是继续单独待在 `[MEMORY SUMMARY]`。

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts`
   - `bun test tests/runtime/compaction-context.test.ts`
2. 确认：
   - latest summary 仍然只在 `[LATEST SESSION SNAPSHOT]`
   - older summary 出现在 `[MEMORY TIMELINE]`
   - `[MEMORY SUMMARY]` 不再重复保留 older summary
3. 再运行：
   - `bun run typecheck`
   - `bun run build`
