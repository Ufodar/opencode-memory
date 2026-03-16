# Data Model: Drop Redundant Context Index Coverage

本轮不新增持久化数据模型。

## 受影响的文本对象

- **ContextIndexCoverageLine**
  - 位置：system context 的 `[CONTEXT INDEX]` section
  - 变化：删除独立 coverage bullet

## 不变部分

- ContextIndexLeadLine
- SummaryRecord
- ObservationRecord
- Worker queue / pending job schema
