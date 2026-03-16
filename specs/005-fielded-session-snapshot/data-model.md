# Data Model: Fielded Session Snapshot

## 现有实体

### SummaryRecord

- `requestSummary`
- `outcomeSummary`
- `nextStep`

## 本轮不改的部分

- 不新增数据库字段
- 不新增新的 summary type
- 不改 `SummaryRecord` 持久化结构

## 新增的编译层概念

### SessionSnapshot

来源：最新一条 `SummaryRecord`

用途：生成当前会话和 compaction 都能用的“最近一轮工作快照”

### SnapshotField

本轮最小字段：

- `Current Focus`
- `Completed`
- `Next`

其中：
- `Current Focus` <- `requestSummary`
- `Completed` <- `outcomeSummary`
- `Next` <- `nextStep` 或 fallback 恢复方向

## 数据流变化

### 现在

```text
latest summary
  -> MEMORY SUMMARY
  -> RESUME GUIDE
```

### 本轮之后

```text
latest summary
  -> session snapshot compiler
  -> SESSION SNAPSHOT

latest summary
  -> curated summary / resume
  -> MEMORY SUMMARY / RESUME GUIDE
```
