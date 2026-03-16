# Data Model: Learned Session Snapshot

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

### Snapshot-covered observations

含义：latest summary 的 `observationIDs` 对应的 observation 集合。

用途：

- 为 latest snapshot 生成一条 `Learned`

### Learned field

含义：从 covered observations 中抽出的、当前会话最该知道的一条短发现。

## 数据流变化

### 现在

```text
latest summary
  -> Current Focus / Completed / Next
```

### 本轮之后

```text
latest summary
  -> covered observations
  -> Current Focus / Learned / Completed / Next
```
