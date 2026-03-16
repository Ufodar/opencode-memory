# 研究记录：Day Grouped Memory Timeline

## `claude-mem` 对照结论

- `claude-mem` 不只给时间点，还会按天组织 timeline。
- 当前 `opencode-memory` 已有：
  - request-aware summary checkpoint
  - 时间前缀
  - 时间混排
- 剩余差距变成：
  - 跨天时还没有日期边界

## 为什么这轮仍在主线

- 不新增存储对象
- 不新增模型调用
- 不改 worker 运行时
- 只增强 context builder 的 timeline 组织方式
