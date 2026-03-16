# Data Model: Request Aware Summary Checkpoints

## 现有实体

### SummaryRecord

- `requestSummary`
- `outcomeSummary`
- `nextStep`

## 本轮不改的部分

- 不新增数据库字段
- 不改 `SummaryRecord` schema

## 新增的运行时概念

### Request-aware summary checkpoint text

含义：把 summary 的 request 与 outcome 编译成一条更容易理解的 timeline checkpoint 文本。

### 现在

```text
[summary] outcome
```

### 本轮之后

```text
[summary] request：outcome
```

若 `requestSummary` 缺失：

```text
[summary] outcome
```
