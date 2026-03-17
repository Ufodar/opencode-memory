# 研究记录：Drop Current Focus Snapshot Field

## `claude-mem` 对照

- `claude-mem` 的 summary 同位置字段是：
  - `Investigated`
  - `Learned`
  - `Completed`
  - `Next Steps`
- 当前 `opencode-memory` 额外多出：
  - `Current Focus`

## 结论

这不是缺少大模块，而是 latest snapshot 字段集合还比 `claude-mem` 多一行。  
本轮只去掉这条额外字段，不扩展到 timeline、footer、worker runtime。
