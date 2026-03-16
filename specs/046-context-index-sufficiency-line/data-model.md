# Data Model: Context Index Sufficiency Line

本轮不新增持久化数据模型。

## 受影响的文本对象

- **ContextIndexLeadLine**
  - 位置：system context 的 `[CONTEXT INDEX]` 首句
  - 变化：从 `recent working index` 改成 `usually sufficient to understand past work`

## 不变部分

- SummaryRecord
- ObservationRecord
- Worker queue / pending job schema
- compaction context schema
