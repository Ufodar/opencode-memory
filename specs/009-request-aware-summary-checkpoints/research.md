# Research: Request Aware Summary Checkpoints

## `claude-mem` 对照

### 当前看到的事实

- `claude-mem` 的 timeline summary item 会带 request 标题  
  证据：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/ColorFormatter.ts`

- 当前 `opencode-memory` 的 `[summary]` 只有 outcome 片段  
  真实输出示例：
  - `- [summary] 已整理 smoke 前置条件并记录到 checklist.md`

## 当前差距

这说明当前 gap 不是“有没有 summary checkpoint”，而是：

**summary checkpoint 还不够容易看出当时围绕什么 request。**

## 本轮决策

1. summary checkpoint 先补 request 语义
2. 仍然 deterministic
3. 不改 snapshot，不改 worker
