# 数据模型：Chronological Memory Timeline

## 不新增持久化对象

本轮不新增表、不新增字段。

直接复用：

- `SummaryRecord.createdAt`
- `ObservationRecord.createdAt`

## 新增的是中间编译视图

### TimelineCheckpoint

编译阶段需要一个统一的 checkpoint 视图，至少包含：

- `createdAt`
- `kind`
  - `summary`
  - `observation`
- `lines`
  - 主行
  - 可选的 next 行

## 排序规则

- 统一按 `createdAt` 升序
- 同时间戳保持稳定次序即可
