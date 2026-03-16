# 数据模型：Action-Led Context Tool Lines

## 涉及对象

- **ContextIndexGuideLine**
  - 当前位置：`[CONTEXT INDEX]`
  - 变化前：工具名在前
  - 变化后：动作在前

## 本轮不变

- `ObservationRecord`
- `SummaryRecord`
- SQLite schema
- worker 请求 / 响应

本轮只调整渲染文本，不引入新实体。
