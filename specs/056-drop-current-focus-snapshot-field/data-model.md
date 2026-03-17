# 数据模型：Drop Current Focus Snapshot Field

## 影响对象

- `SessionSnapshotField`

## 变更

- latest snapshot 字段集合不再包含 `Current Focus`
- 保留：
  - `Investigated`
  - `Learned`
  - `Completed`
  - `Next Steps`

## 不变

- timeline summary child line 继续使用 `Next:`
- snapshot 渲染触发条件不变
