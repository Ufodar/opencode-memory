# Data Model: File Grouped Memory Timeline

## 输入对象

复用现有：

- `SummaryRecord`
- `ObservationRecord`

不新增 schema。

## 新的编译时概念

### Timeline entry

在 timeline 编译阶段，checkpoint entry 需要补充：

- `kind`
  - `summary`
  - `observation`
- `fileLabel?`
  - 仅 observation 使用
  - 来自 observation trace 的主文件线索

### File group line

一种新的渲染行：

- `[file] brief.txt`

约束：

- 只在 observation 有明确文件线索时插入
- 同一文件的连续 observation 不重复插入
- summary 会打断文件分组
