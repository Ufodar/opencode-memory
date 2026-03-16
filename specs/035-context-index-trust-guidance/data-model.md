# Data Model: Context Index Trust Guidance

## 不新增持久化实体

本轮不新增 schema、不新增 store 字段。

## 渲染对象

- **ContextIndexTrustLine**
  - 位置：system context 的 `[CONTEXT INDEX]` section
  - 形式：一条短说明
  - 内容：先使用 index，再决定是否回读历史/代码

## 非目标

- 不改变 timeline 行
- 不改变 footer
- 不改变 compaction context
