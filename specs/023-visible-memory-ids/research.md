# Research: Visible Memory IDs

## 对照来源

- `claude-mem` 的 markdown timeline 会直接显示：
  - `#S<summary-id>`
  - `#<observation-id>`
- 同时 header 明确写：
  - `Fetch by ID: get_observations([IDs])`

对应参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`

## 当前仓库现实约束

- `opencode-memory` 当前已有：
  - `memory_details(ids)`
  - `SummaryRecord.id`
  - `ObservationRecord.id`
- 但 context builder 还没有把这些 ID 编进输出

## 设计判断

1. 这轮只补 system context 的可见 ID。
2. summary 和 observation 都显示 ID。
3. 优先让 system context 与 `memory_details` 真正接上。
4. compaction context 暂时不强制引入 ID，保持轻量。
