# Data Model: Semantic Memory Records

## ObservationRecord（保留现有结构）

本轮不新增新表，也不新增新 kind。  
调整的是 ObservationRecord 里已有文本字段的语义质量。

### 关键字段

- `content`
  - 之前：容易退化成 `read: 文件路径`
  - 目标：描述“这次读到了什么 / 发现了什么”

- `output.summary`
  - 之前：容易和 `content` 一样退化成工具日志
  - 目标：保留后续 summary 聚合最值得消费的短语义片段

- `retrieval.tags`
  - 继续保留
  - 当 observation model 可用时可进一步精炼

- `retrieval.importance`
  - 继续保留
  - 当 observation model 可用时可进一步精炼

- `trace`
  - 必须继续保留
  - 本轮不能因语义化而丢掉已有 evidence

## Observation Refinement Result

### Deterministic 结果

来源：
- `read` 工具原始输出
- 解析 `<content>` 后得到的高信息量文本

字段：
- `content`
- `outputSummary`

### Model-Assisted 结果（可选）

来源：
- `model-observation.ts`

可覆盖：
- `content`
- `outputSummary`
- `tags`
- `importance`

不可覆盖：
- `trace`
- `sessionID`
- `projectPath`
- `tool`

## SummaryRecord（结构不变，语义提升）

不新增字段。  
变化点：

- `outcomeSummary` 更依赖 semantic observation
- `nextStep` 更少退化成原始工具短语

## Context Projection

本轮不新增新的 context section。  
变化点在：

- `[MEMORY SUMMARY]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

这三段的文本来源更语义化。
