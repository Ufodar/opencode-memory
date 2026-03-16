# Data Model: Inline Observation Type Tags

## 不新增持久化实体

继续复用：

- `ObservationRecord.tool.name`

## 新增的临时输出

### InlineObservationTypeTag

- 输入：
  - `observation.tool.name`
- 输出：
  - `{read}`
  - `{write}`
  - `{bash}`

## 约束

- tag 必须短
- tag 来自已有 tool 名，不新增模型输出
- 只影响 system context observation 主行
