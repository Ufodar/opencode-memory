# 数据模型：Day Grouped Memory Timeline

## 不新增持久化对象

本轮不新增表、不新增字段。

直接复用：

- `SummaryRecord.createdAt`
- `ObservationRecord.createdAt`

## 新增的是编译期分组规则

### Timeline Day Group

- 输入：
  - 已排序 checkpoint 列表
- 输出：
  - 当日期切换时，插入日期分组行

### 日期分组行

- 第一版采用 deterministic 短格式：
  - `[day] 2026-03-17`
