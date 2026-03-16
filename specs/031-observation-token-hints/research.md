# Research: Observation Token Hints

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/HeaderRenderer.ts`

关键点：

- `claude-mem` 的记录行会直接暴露 `Read / Work`
- 所以模型不只知道“发生了什么”，也知道“读这条记录要花多少、它代表多少过去工作”

## 当前 `opencode-memory` 状态

当前已经有：

- 全局 `[CONTEXT ECONOMICS]`
- expanded observation 的 `Result / Tool / Evidence`

缺的是：

- observation 自己的局部 token hint

## 本轮策略

- 复用现有 deterministic estimate 思路
- 只给 expanded observation 增加：
  - `Tokens: Read ~X | Work ~Y`
- compaction context 不引入这条 detail line
