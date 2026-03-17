# 数据模型：Memory Search Phase Filter

## Tool 输入

`memory_search` 新增可选字段：

- `phase?: ObservationPhase`

## Worker 输入

`searchMemoryRecords` 新增可选字段：

- `phase?: ObservationPhase`

## Store 输入

`searchMemoryRecords` 新增可选字段：

- `phase?: ObservationPhase`

## 规则

- 指定 `phase` 时，结果面默认 observation-only
- 未指定 `phase` 时，行为不变
