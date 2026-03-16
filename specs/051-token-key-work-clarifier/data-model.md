# Data Model: Token Key Work Clarifier

## 受影响对象

- `TokenKeyWorkLine`
  - 当前：`- Work: past work tokens already spent to produce it`
  - 目标：`- Work: past work tokens already spent to produce it (research, building, deciding)`

## 不变项

- `[TOKEN KEY]` section 是否渲染的规则不变
- `Read` line 不变
- compaction context 不显示 token key 的规则不变
