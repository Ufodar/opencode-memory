# Research: Token Hint Key

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/HeaderRenderer.ts`

关键点：

- `claude-mem` 不只显示 `Read / Work`
- 它还会先解释这两个词的含义

## 当前 `opencode-memory` 状态

当前已经有：

- expanded observation 的 `Tokens: Read ~X | Work ~Y`

缺的是：

- header 中没有解释 `Read` / `Work`

## 本轮策略

- 只在 system context header 增加：
  - `[TOKEN KEY] Read=current reading cost | Work=prior work investment`
- compaction context 不复用这条说明
