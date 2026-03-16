# Data Model: Context Legend

本 feature 不新增数据库实体，也不修改 worker 协议。

新增的只是 system context 输出中的一段编译结果：

- **Timeline Key Section**
  - 位置：`[CONTEXT INDEX]` 之后，`[LATEST SESSION SNAPSHOT]` 之前
  - 作用：解释 timeline 中常见标签的含义
  - 生命周期：仅存在于 system context 文本中，不写入 SQLite，不进入 compaction context
