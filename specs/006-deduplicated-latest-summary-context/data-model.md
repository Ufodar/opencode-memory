# Data Model: Deduplicated Latest Summary Context

## 现有实体

### SummaryRecord

- `requestSummary`
- `outcomeSummary`
- `nextStep`
- `createdAt`

## 本轮不改的部分

- 不新增数据库字段
- 不改 `SummaryRecord` 持久化结构
- 不改 retrieval tool 返回结构

## 新增的运行时概念

### Snapshot-backed latest summary

含义：最新一条 summary 已经成功被编译成：

- `Current Focus`
- `Completed`
- `Next`

此时它不应再在后续 summary section 里重复出现。

### Remaining summaries

含义：除最新一条外的更早 summaries。

用途：

- system context 里的 `MEMORY SUMMARY`
- compaction context 里的 `Recent memory summaries:`

## 数据流变化

### 现在

```text
latest summary
  -> SESSION SNAPSHOT
latest summary
  -> MEMORY SUMMARY
```

### 本轮之后

```text
latest summary
  -> SESSION SNAPSHOT

older summaries
  -> MEMORY SUMMARY
```
