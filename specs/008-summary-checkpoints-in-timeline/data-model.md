# Data Model: Summary Checkpoints In Timeline

## 现有实体

### SummaryRecord

- `requestSummary`
- `outcomeSummary`
- `nextStep`
- `observationIDs`

### ObservationRecord

- `content`
- `phase`
- `trace`

## 本轮不改的部分

- 不新增数据库字段
- 不改 `SummaryRecord` / `ObservationRecord` 持久化 schema

## 新增的运行时概念

### Summary checkpoint line

含义：older summary 在 `[MEMORY TIMELINE]` 中显示的一条 timeline item。

用途：

- 给当前会话一个统一时间线
- 避免 older summary 同时出现在 timeline 和独立 summary section

## 数据流变化

### 现在

```text
latest summary
  -> [LATEST SESSION SNAPSHOT]
older summaries
  -> [MEMORY SUMMARY]
observations
  -> [MEMORY TIMELINE]
```

### 本轮之后

```text
latest summary
  -> [LATEST SESSION SNAPSHOT]
older summaries
  -> [MEMORY TIMELINE] summary checkpoints
observations
  -> [MEMORY TIMELINE]
```
