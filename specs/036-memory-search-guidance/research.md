# 研究记录：Memory Search Guidance

## `claude-mem` 对照

`claude-mem` 在 Context Index 同位置的工具说明里，不只写“可以搜索”，而是明确写：

- 过去决策
- bug
- 更深的研究

这比抽象的 “broader lookup” 更利于模型判断什么时候该用 search。

## 当前仓现状

`opencode-memory` 已经有：

- `memory_details=visible ID -> record detail`
- `memory_timeline=checkpoint window`
- `memory_search=broader lookup`

所以当前缺的不是工具能力，而是 `memory_search` 这条说明还不够具体。

## 本轮约束

- 只改 `memory_search` 的文字说明
- 不改其他工具语义
- 不改 compaction context
