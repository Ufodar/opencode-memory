# Research: Loading Observations Wording

## 对照结论

- `claude-mem` 在 `MarkdownFormatter.renderMarkdownContextEconomics()` 中使用：
  - `Loading: N observations (...)`
- `opencode-memory` 当前 `buildContextEconomicsLines()` 仍使用：
  - `Loading: N records (...)`

## 本轮决策

- 只对齐这一处单位词
- 不改数量计算方式
- 不改其它 economics 行
