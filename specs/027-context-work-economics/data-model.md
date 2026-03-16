# Data Model: Context Work Economics

## 不新增持久化实体

这轮不修改：

- observation schema
- summary schema
- sqlite 表结构

## 新增的临时计算对象

### ContextEconomicsEstimate

- `summaryCount: number`
- `directObservationCount: number`
- `coveredObservationCount: number`
- `loadingTokens: number`
- `workTokens: number`
- `savingsTokens: number`
- `savingsPercent: number`

## 估算来源

### Loading

- summary:
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`
- observation:
  - `content`

### Work investment

- summary:
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`
- observation:
  - `input.summary`
  - `output.summary`
  - `content`

## 约束

- 所有值必须是 deterministic estimate
- `savingsTokens >= 0`
- `savingsPercent >= 0`
