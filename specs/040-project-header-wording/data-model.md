# 数据模型：Project Header Wording

## 涉及对象

- **ProjectHeaderLine**
  - 当前位置：system context 头部中的 freshness 行
  - 变化前：`Project: ... | Generated: ...`
  - 变化后：`# [project] recent context, ...`

## 本轮不变

- `ObservationRecord`
- `SummaryRecord`
- SQLite schema
- worker 请求 / 响应

本轮只调整渲染文本，不引入新实体。
