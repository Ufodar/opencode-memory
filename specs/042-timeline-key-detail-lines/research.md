# 研究记录：Timeline Key Detail Lines

## `claude-mem` 对照

`claude-mem` 的 legend / column key 不会全部压在一行里，而是拆成更容易扫读的多行。

## 当前仓现状

`opencode-memory` 现在已经有：

- `[TIMELINE KEY]`
- 一条压缩说明，里面同时塞了 summary / phase / tool / day / file

所以当前缺的不是 timeline key 本身，而是 timeline key 的可读性。

## 本轮约束

- 只改 system context 的 `[TIMELINE KEY]`
- 不改 `[TOKEN KEY]`
- 不改 compaction context
- 不改 timeline、footer、schema、worker runtime
