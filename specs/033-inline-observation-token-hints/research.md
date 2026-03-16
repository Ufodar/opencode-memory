# Research: Inline Observation Token Hints

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/TimelineRenderer.ts`

关键点：

- `claude-mem` 的 observation 行本身就会显示 `Read / Work`
- 所以模型在不展开记录时，也能先判断哪条记录值得细看

## 当前 `opencode-memory` 状态

当前已经有：

- expanded observation detail 的 `Tokens: Read ~X | Work ~Y`
- header 里的 `[TOKEN KEY]`

缺的是：

- observation 主行本身的 token hint

## 本轮策略

- 复用现有 deterministic estimate
- 只给 system context observation 主行追加：
  - `Read ~X | Work ~Y`
- compaction context 不引入这条行内提示
