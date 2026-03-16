# Research: File Grouped Memory Timeline

## `claude-mem` 对照

- `claude-mem` 的 timeline renderer 会在同一天内部继续按文件组织 observation。
- `opencode-memory` 当前虽然已经有：
  - request-aware summary checkpoint
  - `HH:MM` 时间前缀
  - chronological 混排
  - `[day] YYYY-MM-DD`
- 但 observation 仍然只是行尾 evidence hint：
  - `(files: brief.txt)`

## 当前差距

- 同一天处理多个文件时，不容易一眼看出“这几条 observation 属于哪个文件”。
- 当前最自然的补法不是新增 schema，而是复用 observation trace 里已有的文件线索，在 timeline 编译阶段插入 `[file] 文件名`。

## 决策

- 不新增数据库字段。
- 不改变 summary / observation 的存储结构。
- 只在 system / compaction context 编译阶段新增文件分组线。
- summary checkpoint 继续保持独立，不进入文件分组。
