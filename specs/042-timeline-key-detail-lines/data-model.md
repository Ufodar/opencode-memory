# 数据模型：Timeline Key Detail Lines

## 涉及对象

- **TimelineKeyDetailLine**
  - 当前位置：`[TIMELINE KEY]` 下的说明行
  - 变化前：单行压缩说明
  - 变化后：多条完整说明

## 本轮不变

- `ObservationRecord`
- `SummaryRecord`
- SQLite schema
- worker 请求 / 响应

本轮只调整渲染文本，不引入新实体。
