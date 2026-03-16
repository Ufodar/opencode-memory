# 研究记录：Timestamped Memory Timeline Checkpoints

## `claude-mem` 对照结论

- `claude-mem` 的 timeline item 不是只有内容，还带时间信息。
- 这让 timeline 更像“工作轨迹”，而不是“若干压缩句子”。
- 当前 `opencode-memory` 的差距已经不再是：
  - 有没有 timeline
  - 有没有 summary checkpoint
  - checkpoint 有没有 request 语义
- 剩余最真实的差距变成：
  - timeline checkpoint 缺少短时间定位

## 为什么这轮还在主线

- 这轮不新增数据对象。
- 这轮不引入模型调用。
- 这轮只增强 context builder 的时间定位能力。
- 因此它仍然是 `claude-mem` context builder 主线上的成熟度补齐。

## 设计判断

- 不做完整按天分组。
- 不做长时间戳。
- 第一版只做短时间标记，优先保证：
  - 可读
  - deterministic
  - 不打爆 budget

## 兼容性判断

- 生产记录的 `createdAt` 是 epoch 毫秒。
- 现有测试里有大量 synthetic 小整数时间戳。
- 为避免这些 fixture 全部迁移，第一版需要：
  - 只在值看起来像可信 epoch 毫秒时渲染时间
  - synthetic 小整数继续不显示时间
