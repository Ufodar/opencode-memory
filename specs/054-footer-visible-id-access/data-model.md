# Data Model: Footer Visible ID Access

## 受影响对象

- `ContextValueDrilldownLine`
  - 当前：`If this index is still not enough, use memory_details with visible IDs before re-reading history.`
  - 目标：`If this index is still not enough, use memory_details with visible IDs to access deeper memory before re-reading history.`

## 不变项

- `ContextValueCondenseLine` 不变
- `ContextValueAccessLine` 不变
- `[CONTEXT VALUE]` section 是否渲染的规则不变
