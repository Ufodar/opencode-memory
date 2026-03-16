# Research: Project Freshness Header

## 对照来源

- `claude-mem` 的 markdown header 形如：
  - `# [project] recent context, 2026-...`
- 它的价值不在样式本身，而在于一开始就告诉模型：
  - 这是哪个项目的上下文
  - 这份上下文是什么时候生成的

对应参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/HeaderRenderer.ts`

## 当前仓库现实约束

- `opencode-memory` 当前没有单独的 header model
- 当前可直接拿到的 project 线索在：
  - `SummaryRecord.projectPath`
  - `ObservationRecord.projectPath`
- 当前可在 build 时直接生成本地时间

## 设计判断

1. 这轮只补 system context header 的 project/freshness 行。
2. 项目名优先从当前 injected records 的 `projectPath` basename 推断。
3. 生成时间使用当前本地时间。
4. compaction context 不引入这段 header。
