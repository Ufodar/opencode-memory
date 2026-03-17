# Data Model: Language-Neutral Memory Core

## Output Language Policy

新增一个最小配置概念：

- `OPENCODE_MEMORY_OUTPUT_LANGUAGE`

推荐取值：

- `en`
- `zh`

第一版不扩展更多语言，也不支持复杂 locale。

## Decision Signal

Decision signal 继续是文本 heuristics，不引入新的数据库字段。

这轮只扩展其可识别模式：

- 中文：保留现有有效模式
- 英文：补 `Decision:`、`Decided to`、`Next step:` 等最小稳定模式

## Retrieval-Only Prompt

Retrieval-only prompt 仍不落库；这轮不增加表结构，只扩展判断规则。

关键判定维持两段式：

1. 先确认 prompt 提到了 `memory_*` 工具
2. 再确认 prompt 明确表达“只做 memory / 不读文件 / 不做工作推进”

## Summary / Observation Prompt Language

这轮不改变 summary / observation 的返回数据结构：

- `ModelSummaryResult`
- `ModelObservationResult`

只改变其请求 prompt 的语言约束，以及 `weak next step` 的规范化逻辑。
