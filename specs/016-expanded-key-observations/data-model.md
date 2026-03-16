# Data Model: Expanded Key Observations

## ExpandedObservationView

表示 context builder 中被选为“关键 observation”的展示视图，不新增持久化字段。

### Fields

- `id`: 来自 `ObservationRecord.id`
- `createdAt`: 来自 `ObservationRecord.createdAt`
- `headline`: observation 的主行文本
- `detailLines`: 由现有 observation 字段编译出的附加行
- `fileLabel`: 若已有主文件分组，用于与 `[file] xxx` 头协同工作

## ObservationDetailLine

表示展开 observation 时附加的一行文本。

### Fields

- `kind`: `result` | `tool` | `evidence`
- `text`: 展示给当前 context 的行文本

### 来源

- `result`: 主要来自 `observation.output.summary`
- `tool`: 主要来自 `observation.tool`
- `evidence`: 主要来自 `observation.trace`

## 约束

- detail lines 不能只是机械重复主行 headline。
- detail lines 可以为空；为空时 observation 保持单行。
- 这轮不改变 `ObservationRecord` 的持久化结构，只在编译期派生新视图对象。
