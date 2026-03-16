# Data Model: Token Key Read Clarifier

## 受影响对象

- `TokenKeyReadLine`
  - 当前：`- Read: cost to read this memory now`
  - 目标：`- Read: cost to read this memory now (cost to learn it now)`

## 不变项

- `[TOKEN KEY]` section 是否渲染的规则不变
- `Work` line 不变
- compaction context 不显示 token key 的规则不变
