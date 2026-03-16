# Data Model：Stale Snapshot Gating

本 feature 不新增持久化数据模型。

## 输入

- `latestSummary.createdAt`
- direct `observations[].createdAt`

## 输出

- latest snapshot 是否渲染
- stale 时，summary 仍保留在 timeline 中
