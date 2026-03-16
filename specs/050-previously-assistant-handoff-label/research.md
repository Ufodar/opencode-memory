# Research: Previously Assistant Handoff Label

## 对照结论

当前 `opencode-memory` 已经有 `[PREVIOUSLY]` section，但它只是普通 bullet。

本地 `claude-mem` 在同位置会明确标出 assistant handoff，使用 `A:` 前缀。

## 本轮范围

只补这一个表达差距：

- 有 handoff 时加 `A:`
- 无 handoff 时仍不渲染

不改其他 section。
