# Quickstart: Drop Redundant Context Index Sufficiency Bullet

## 目标

验证 system context 的 `[CONTEXT INDEX]` 中：

- 首句仍保留 semantic index + sufficiency wording
- 独立 sufficiency bullet 被移除

同时确保 compaction context 继续不带这条 bullet。

## 步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts`
2. 确认：
   - system context 不再出现 `Usually enough to continue work; drill down only for evidence, implementation detail, or prior rationale.`
   - compaction context 也不出现这条 line
3. 回归：
   - `bun test`
   - `bun run typecheck`
   - `bun run build`
