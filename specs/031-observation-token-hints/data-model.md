# Data Model: Observation Token Hints

## 不新增持久化实体

继续复用：

- `ObservationRecord.content`
- `ObservationRecord.input.summary`
- `ObservationRecord.output.summary`

## 新增的临时输出

### ObservationTokenHint

- 输入：
  - `content`
  - `input.summary`
  - `output.summary`
- 输出：
  - `Tokens: Read ~X | Work ~Y`

## 约束

- 必须是 deterministic estimate
- 只作用于 expanded observation detail
- 不进入折叠行
