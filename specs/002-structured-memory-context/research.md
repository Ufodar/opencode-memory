# Research: Structured Memory Context

## `claude-mem` 对照

本轮主线判断基于这些文件：

- `projects/claude-mem/src/services/context/ContextBuilder.ts`
- `projects/claude-mem/src/services/context/ObservationCompiler.ts`
- `projects/claude-mem/src/services/context/sections/TimelineRenderer.ts`

当前确认：

1. `claude-mem` 的强点不只是 retrieval
2. 它会把 observation / summary 再编译成结构化 context
3. timeline 在这里不是数据库查询结果原样输出，而是编译后的工作索引

## 当前 `opencode-memory` 状态

本地对应文件：

- `projects/opencode-memory/src/runtime/injection/system-context.ts`
- `projects/opencode-memory/src/runtime/injection/compaction-context.ts`
- `projects/opencode-memory/src/tools/memory-context-preview.ts`

当前判断：

- evidence hint 已接入
- summary-first discipline 已接入
- budget 已接入

但 system context 仍然是平的：

- recent summaries
- recent observations

这和 `claude-mem` 在“编译后的工作索引”这一层仍有明显差距。

## 本轮为什么成立

这一轮建议成立，因为：

1. 不是发散到 embedding
2. 不是发散到新工具
3. 是继续补当前会话实际看到的 memory 质量

也就是说，这一轮继续补的还是：

**memory 被重新接回当前工作流的质量。**
