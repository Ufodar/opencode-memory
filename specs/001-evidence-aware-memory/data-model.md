# Data Model: Evidence-Aware Memory

## Observation Evidence

### 当前 observation trace

```ts
trace: {
  relatedPromptId?: string
  workingDirectory?: string
  filePaths?: string[]
  filesRead?: string[]
  filesModified?: string[]
  command?: string
}
```

## 这轮要影响的对象

### 1. MemoryObservationDetailRecord

当前：

- `inputSummary`
- `outputSummary`
- `trace`

这轮目标：

- 继续保留 `trace`
- 明确 detail 使用者可以稳定拿到：
  - `workingDirectory`
  - `filesRead`
  - `filesModified`
  - `command`

### 2. MemoryTimelineItem

当前 observation item 只有：

- `id`
- `content`
- `createdAt`
- `phase`
- `tool`
- `importance`
- `tags`

这轮目标：

- 在 observation timeline item 上增加最小必要 evidence 视图
- 先不搬全部 detail 字段
- 只补足 timeline 解释真正需要的字段

建议最小集合：

- `workingDirectory?`
- `filesRead?`
- `filesModified?`
- `command?`

### 3. Injected Evidence Hint

这不是新的持久化对象，而是 observation evidence 的短文本投影。

候选形态：

- `files: requirements.md, questions.md`
- `cmd: bun test`

要求：

- 必须短
- 必须 budget-aware
- 必须优先保留有价值线索

## 非目标

- 不新增原始 payload 持久化表
- 不新增全文命令输出持久化
- 不把 timeline item 直接等同于 detail record
