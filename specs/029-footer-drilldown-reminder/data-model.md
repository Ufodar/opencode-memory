# Data Model: Footer Drilldown Reminder

## 不新增持久化实体

继续复用：

- `SummaryRecord`
- `ObservationRecord`
- 已有 visible ID 渲染

## 新增的临时输出

### FooterDrilldownReminderLine

- 输入：
  - 当前 context 已暴露 visible ID
- 输出：
  - `If this index is still not enough, use memory_details with visible IDs before re-reading history.`

## 约束

- 不改变 schema
- 不改变 retrieval 结果
- 不新增工具
- 只改变 system context footer 文本
