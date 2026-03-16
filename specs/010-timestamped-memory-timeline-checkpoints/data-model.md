# 数据模型：Timestamped Memory Timeline Checkpoints

## 不新增持久化对象

本轮不新增表、不新增字段。

直接复用现有字段：

- `ObservationRecord.createdAt`
- `SummaryRecord.createdAt`

## 新增的只是编译规则

### Timeline Checkpoint Display

- 输入：
  - `createdAt`
  - checkpoint 内容
- 输出：
  - `[HH:MM] [summary] ...`
  - `[HH:MM] [research] ...`
  - 或在缺少可信时间戳时退回原格式

## 可信时间戳规则

- 第一版只接受“像 epoch 毫秒”的值
- synthetic 小整数不参与显示

## 共享边界

同一套时间前缀规则必须同时服务：

- system context
- compaction context
