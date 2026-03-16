# 研究记录：Action-Led Context Tool Lines

## `claude-mem` 对照

`claude-mem` 在 Context Index 的工具说明里，不是先写工具名，而是先写动作：

- `Fetch by ID: ...`
- `Search history: ...`

这让这几条说明更像“下一步怎么做”，而不是参数提示。

## 当前仓现状

`opencode-memory` 现在已经有：

- `When you need implementation details, rationale, or debugging context:`
- 三条分开的工具 bullet

但三条 bullet 仍然是：

- `memory_details=...`
- `memory_timeline=...`
- `memory_search=...`

所以当前缺的不是工具能力，也不是导语，而是工具说明的动作化表述。

## 本轮约束

- 只改 system context 正常预算下的三条工具 bullet wording
- 不改低预算压缩版
- 不改 compaction context
- 不改 timeline、footer、schema、worker runtime
