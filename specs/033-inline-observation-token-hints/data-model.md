# Data Model: Inline Observation Token Hints

## 不新增持久化实体

本轮不新增 schema、不新增 store 字段。

## 渲染对象

- **InlineObservationTokenHint**
  - 位置：system context 的 observation 主行
  - 形式：`Read ~X | Work ~Y`
  - 来源：现有 observation 的 deterministic token estimate

## 非目标

- 不改变 expanded detail 的 `Tokens:` 行
- 不改变 compaction context observation 行
