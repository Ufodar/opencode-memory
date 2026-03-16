# Research: Context Economics

## 对照来源

- `claude-mem` 的 header renderer 会输出 `Context Economics`
- 其目标不是展示漂亮数字，而是告诉模型：当前注入的索引压缩了多少过去工作，先信索引，再决定是否下钻

对应参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/HeaderRenderer.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`

## 当前仓库现实约束

- `opencode-memory` 目前没有像 `claude-mem` 那样稳定的 read/work token 字段
- 当前对象里可直接、可信地拿到的是：
  - summaries 数量
  - observations 数量
  - summary.observationIDs 覆盖关系

因此这轮不做 token economics，而做 **coverage economics**：

- injected summaries
- direct observations
- covered observations

## 设计判断

1. 这轮只补 header 的一小段说明，不改 timeline。
2. economics 只进 system context，不进 compaction。
3. economics 必须短，避免挤压已有 snapshot / timeline。
4. 覆盖数以 injected summaries 为准，不统计全库。
