# Data Model: Multi Expanded Observations

## ExpandedObservationWindow

表示 context builder 选择“最近多少条 observation 可以展开”的窗口，不新增持久化字段。

### Fields

- `maxExpandedObservations`: 允许展开的 observation 数量
- `selectedObservationIDs`: 这次 context 编译里被选中的 observation ID 集合

## 约束

- 当前默认窗口大小为 2
- 选择逻辑按 `createdAt` 从新到旧
- 超出窗口的 observation 必须保持单行
