# Research: Context Work Economics

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/TokenCalculator.ts`

关键点：

- `claude-mem` 会在 header 里显示：
  - `Loading`
  - `Work investment`
  - `Your savings`
- 它依赖 observation 自带的 `discovery_tokens` 和内容大小估算

## 当前 `opencode-memory` 状态

当前文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`

当前只有：

- summaries 数量
- direct observations 数量
- covered observations 数量

缺的不是 section，而是量化值。

## 本轮采取的保守策略

这轮不新增 schema，不把 `discovery_tokens` 写进 observation 表。

改用 deterministic estimate：

- `Loading`
  - 基于当前会注入的 summary / observation 文本长度估算
- `Work investment`
  - 基于 observation 的 `input.summary + output.summary + content`
  - 以及 summary 的 `requestSummary + outcomeSummary + nextStep`
- `Your savings`
  - `max(work - loading, 0)`

这样能补齐 header 的量化差距，同时不把本轮问题扩大到 storage/runtime。
