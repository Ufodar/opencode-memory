# Research: Context Index Trust Guidance

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`

关键点：

- `claude-mem` 的 Context Index 不只是介绍内容范围
- 它还会明确告诉模型：
  - 先信这份 index
  - 不要一上来就回头重读代码或历史

## 当前 `opencode-memory` 状态

当前已经有：

- recent working index
- coverage 说明
- usually enough to continue work

缺的是：

- 一条更明确的 trust-before-reread 使用原则

## 本轮策略

- 只在 system context 的 `[CONTEXT INDEX]` 后补一条短说明
- 明确“先用这份 index，再决定是否回读历史/代码”
- compaction context 不引入这条说明
