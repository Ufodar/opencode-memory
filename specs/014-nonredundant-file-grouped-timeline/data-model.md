# Data Model: Nonredundant File Grouped Timeline

## 输入对象

复用现有：

- `SummaryRecord`
- `ObservationRecord`

不新增 schema。

## 编译时规则

### observation evidence hint

- 如果 observation 没有文件分组线：
  - 保持现有 hint 逻辑
- 如果 observation 已经有 `[file] 文件名` 分组线：
  - 不再重复显示 `files: ...`
- 非文件 hint，例如：
  - `cmd: python ...`
  仍应保留
