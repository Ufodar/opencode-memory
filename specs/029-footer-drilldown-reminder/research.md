# Research: Footer Drilldown Reminder

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/FooterRenderer.ts`

关键点：

- `claude-mem` footer 不只给量化价值句
- 它还会在同一个 footer 位置告诉模型：这份 index 不够时，应该顺着当前 index 继续下钻

## 当前 `opencode-memory` 状态

当前文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`

当前已经有：

- `[CONTEXT VALUE]`
- `This index condenses ...`
- `Access ~X tokens of prior work for just ~Y tokens of reading.`

缺的是：

- 在 footer 同位置再补一句短的下钻动作提醒，把“index 的价值”直接接到“visible ID -> memory_details”

## 本轮策略

- 不改变 header guide
- 不改变 economics estimate
- 只在 `[CONTEXT VALUE]` 里追加一条短提醒
- compaction context 保持不变
