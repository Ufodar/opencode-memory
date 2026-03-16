# Research: Context Index Coverage

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/HeaderRenderer.ts`

关键点：

- `claude-mem` 的 Context Index 不只说“这是 index”
- 它还会明确指出这份 index 覆盖 titles/types/files/tokens 这类线索

## 当前 `opencode-memory` 状态

当前已经有：

- `This memory snapshot is a recent working index.`
- 下钻说明

缺的是：

- 对 index 覆盖内容范围的简短解释

## 本轮策略

- 只在 system context 的 `[CONTEXT INDEX]` 后补一条短说明
- 用 summaries / phases / tools / files / tokens 来描述覆盖范围
- compaction context 不引入这条说明
