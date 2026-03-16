# Quickstart: Previously Handoff Context

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts`
   - `bun test tests/tools/memory-context-preview.test.ts`
   - `bun run typecheck`
   - `bun run build`
2. 确认：
   - 有 `priorAssistantMessage` 时，system context 出现 `[PREVIOUSLY]`
   - 没有 `priorAssistantMessage` 时，不出现该 section
   - `memory_context_preview` 返回的 `lines` 中也能看到同样的 `[PREVIOUSLY]`
3. 确认：
   - 现有 `[LATEST SESSION SNAPSHOT]`
   - `[MEMORY TIMELINE]`
   - `[RESUME GUIDE]`
   都没有被破坏
