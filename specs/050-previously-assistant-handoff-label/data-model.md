# Data Model: Previously Assistant Handoff Label

## 受影响对象

- `PreviouslyAssistantHandoffLine`
  - 当前：`- <handoff>`
  - 目标：`- A: <handoff>`

## 不变项

- `priorAssistantMessage` 数据来源不变
- `[PREVIOUSLY]` section 是否出现的判定不变
- handoff 主体文本压缩规则不变
