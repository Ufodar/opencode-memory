# Research: Quantified Context Value

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/FooterRenderer.ts`

关键点：

- `claude-mem` footer 会把价值收成一句：
  - `Access X tokens of past research & decisions for just Yt`

## 当前 `opencode-memory` 状态

当前文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`

当前已经有：

- `[CONTEXT ECONOMICS]` 数字
- `[CONTEXT VALUE]` 泛化判断

缺的是把数字重新收成一句收尾判断。

## 本轮策略

- 不改变 economics 计算方式
- 只在 `[CONTEXT VALUE]` 里增加第二行量化句
- 句子直接复用本轮已有 economics estimate
