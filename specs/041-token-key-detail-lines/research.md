# 研究记录：Token Key Detail Lines

## `claude-mem` 对照

`claude-mem` 的 token column key 不只给缩写，还会分别解释：

- `Read` 是现在读懂这一条的成本
- `Work` 是过去为了产出这一条已经投入的工作量

## 当前仓现状

`opencode-memory` 现在已经有：

- `[TOKEN KEY]`
- `Read=current reading cost | Work=prior work investment`

所以当前缺的不是 token 提示本身，而是 token key 的完整解释。

## 本轮约束

- 只改 system context 的 `[TOKEN KEY]`
- 不改 `[TIMELINE KEY]`
- 不改 compaction context
- 不改 timeline、footer、schema、worker runtime
