# 研究记录：Loading Line Record Count

## `claude-mem` 对照

- `claude-mem` 的 economics 同位置在 `Loading` 行里会直接带出当前加载了多少条记录
- 当前 `opencode-memory` 的 `Loading` 行只有 token 数

## 结论

这不是缺少大模块，而是 `Loading` 行还少一个直接可读的记录数。  
本轮只补这一个信息，不扩展到其他 economics 行。
