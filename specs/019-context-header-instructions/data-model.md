# Data Model: Context Header Instructions

本 feature 不新增数据库实体，也不修改 worker 协议。

新增的只是 system context 输出中的一段编译结果：

- **Context Index Section**
  - 位置：`[CONTINUITY]` 与 `Scope` 之后，`[LATEST SESSION SNAPSHOT]` 之前
  - 作用：告诉模型当前 memory index 的可信边界，以及继续下钻的工具路径
  - 生命周期：仅存在于 system context 文本中，不写入 SQLite，不进入 compaction context
