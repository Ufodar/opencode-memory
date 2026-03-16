# Data Model: Drop Redundant Context Index Sufficiency Bullet

本轮不新增持久化数据模型。

## 受影响的文本对象

- **ContextIndexSufficiencyBullet**
  - 位置：system context 的 `[CONTEXT INDEX]` section
  - 变化：删除独立 sufficiency bullet

## 不变部分

- ContextIndexLeadLine
- SummaryRecord
- ObservationRecord
- Worker queue / pending job schema
