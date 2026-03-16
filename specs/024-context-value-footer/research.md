# Research：Context Value Footer

## `claude-mem` 对照

- 参考文件：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- 关键差距：
  - `claude-mem` 在 footer 里有一句把 token economics 收成“为什么值”的总结
  - `opencode-memory` 已有 `[CONTEXT ECONOMICS]`，但没有这一句收尾价值判断

## 当前项目约束

- 当前 system context 由 `/src/runtime/injection/compiled-context.ts` 编译
- 当前 header 辅助文本集中在 `/src/runtime/injection/curated-context-text.ts`
- compaction context 明确保持比 system context 更轻

## 决策

- 只给 system context 增加简短 footer
- footer 基于已有统计字段生成
- 不新建数据库字段
- 不触碰 worker/runtime
