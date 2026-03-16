# Data Model：Snapshot Investigated

本 feature 不新增持久化数据模型。

## 输入

- latest summary 覆盖的 observation records
- 每条 observation 的：
  - `filesRead`
  - `filesModified`
  - `command`

## 输出

- latest snapshot 新增可选字段：
  - `Investigated`

该字段只存在于编译后的 context 文本中，不写数据库。
