# Data Model: Quantified Context Value

## 不新增持久化实体

继续复用：

- `ContextEconomicsEstimate`

## 新增的临时输出

### QuantifiedContextValueLine

- 输入：
  - `loadingTokens`
  - `workTokens`
- 输出：
  - `Access ~X tokens of prior work for just ~Y tokens of reading.`

## 约束

- 不改变 economics estimate 数据源
- 只改变 `[CONTEXT VALUE]` 的输出文本
