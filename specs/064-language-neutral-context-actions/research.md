# Research: Language-Neutral Context Actions

## `claude-mem` 对照结论

- `claude-mem` 的 context builder / footer / continuation copy 默认是英文、通用、面向恢复工作的。
- 在 `063` 之后，`opencode-memory` 的核心 heuristics 已经不再明显写死中文，但 deterministic context action fallback 里还残留中文前缀。

## 当前问题

- 位置：`src/runtime/injection/curated-context-text.ts`
- 当前问题：
  - `继续从...开始`
  - `继续处理...`
- 这些字符串会直接出现在：
  - latest snapshot 的 `Next Steps`
  - `RESUME GUIDE`
  - compaction snapshot fallback

## 设计选择

- 复用 `063` 引入的 `OPENCODE_MEMORY_OUTPUT_LANGUAGE`
- 默认英文
- 显式 `zh` 时保留中文

## 不做

- 不翻译 summary / observation 内容本身
- 不改 system/compaction context 的 section 结构
- 不新增 i18n 框架
