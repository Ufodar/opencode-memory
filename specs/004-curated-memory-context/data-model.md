# Data Model: Curated Memory Context

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
- 不新增新的 memory kind
- 不修改 `SummaryRecord` / `ObservationRecord` 的持久化 schema

## 新增的编译层概念

### CuratedSummaryLine

- 来源：`SummaryRecord`
- 用途：生成 `[MEMORY SUMMARY]` 下的短摘要
- 特点：
  - 只服务当前注入文本
  - 不落库

### CuratedTimelineLine

- 来源：`ObservationRecord`
- 用途：生成 `[MEMORY TIMELINE]` 或 compaction 里的短 checkpoint
- 特点：
  - 保留 phase / evidence hint
  - observation 正文比原始 `content` 更短

### ResumeActionHint

- 来源：`SummaryRecord.nextStep` 或 fallback summary/observation
- 用途：生成 `[RESUME GUIDE]`
- 特点：
  - 优先短动作句
  - 不重复整条长 summary

## 数据流变化

### 现在

```text
summary.outcomeSummary
  -> 直接进入 [MEMORY SUMMARY]

observation.content
  -> 直接进入 [MEMORY TIMELINE]

summary / observation
  -> 直接进入 [RESUME GUIDE]
```

### 本轮之后

```text
summary.outcomeSummary
  -> curated summary compiler
  -> [MEMORY SUMMARY]

observation.content
  -> curated timeline compiler
  -> [MEMORY TIMELINE]

nextStep / summary / observation
  -> curated resume compiler
  -> [RESUME GUIDE]
```
