# 研究记录：Project Header Wording

## `claude-mem` 对照

`claude-mem` 在头部最前面会用标题式 wording 表达：

- 项目名
- recent context
- 当前生成时间

而不是 `Project: ... | Generated: ...` 这种标签式组合。

## 当前仓现状

`opencode-memory` 现在已经有：

- `[CONTINUITY]`
- `Scope: ...`
- `Project: ... | Generated: ...`

所以当前缺的不是项目信息，也不是生成时间，而是头部这行的标题式表达。

## 本轮约束

- 只改 system context 头部单行 wording
- 不改 `[CONTINUITY]`
- 不改 section 顺序
- 不改 compaction context
- 不改 timeline、footer、schema、worker runtime
