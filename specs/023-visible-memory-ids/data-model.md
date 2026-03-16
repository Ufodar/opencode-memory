# Data Model: Visible Memory IDs

## 输入对象

- `SummaryRecord.id`
- `ObservationRecord.id`

## 输出位置

### Summary

可见位置：

- `[LATEST SESSION SNAPSHOT]` 中的某一行
- 或 `[MEMORY TIMELINE]` summary line

### Observation

可见位置：

- `[MEMORY TIMELINE]` observation line

## 输出约束

- ID 必须短，避免压垮当前 line
- 推荐格式：
  - `#sum_1`
  - `#obs_3`
