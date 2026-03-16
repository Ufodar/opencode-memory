# Data Model: Previously Handoff Context

## 输入对象

继续复用现有：

- `SummaryRecord`
- `ObservationRecord`

本轮不新增持久化实体。

## 新增的编译输入

### PriorAssistantMessage

一种新的编译时输入：

- `priorAssistantMessage?: string`

含义：

- 当前 session 最后一条 assistant 文本
- 已在 plugin 侧做最小筛选，只保留 text parts
- 允许为空

约束：

- 不进入数据库
- 不进入 summary / observation
- 只参与 system context 编译

## 新增的输出 section

### Previously Section

一种新的只读 section：

- 标题：`[PREVIOUSLY]`
- 内容：上一条 assistant 文本的整理版

约束：

- 只有 `priorAssistantMessage` 存在时才渲染
- 不替代已有的 snapshot / timeline / resume guide
- 不参与 timeline 排序
