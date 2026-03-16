# Data Model: Context Economics

## 输入对象

### System Context Input

- `summaries: SummaryRecord[]`
- `observations: ObservationRecord[]`
- `latestSummaryObservations?: ObservationRecord[]`

## 派生计数

### `summaryCount`

- 定义：当前 injected summaries 的数量
- 来源：`summaries.length`

### `directObservationCount`

- 定义：当前直接注入 timeline 的 observation 数量
- 来源：`observations.length`

### `coveredObservationCount`

- 定义：当前 injected summaries 已覆盖的 observation 数量
- 来源：`new Set(summaries.flatMap(summary => summary.observationIDs)).size`

## 输出对象

### Context Economics Section

建议保持为两到三行：

- `[CONTEXT ECONOMICS]`
- `- summaries: X | direct observations: Y | covered observations: Z`
- 可选一行短说明：`- Start from this compact index before drilling into details.`

这轮不增加数据库字段，也不持久化任何 economics 结果。
