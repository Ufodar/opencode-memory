# 研究记录：Chronological Memory Timeline

## `claude-mem` 对照结论

- `claude-mem` 的 context builder 会先把 summary 与 observation 合并，再按时间排序。
- 当前 `opencode-memory` 的差距不是“有没有 timeline”，而是：
  - timeline 仍然按类型输出
  - 不是按时间混排

## 为什么这轮仍在主线

- 不新增存储对象
- 不新增模型调用
- 不改 worker 运行时
- 只补 context builder 的 timeline 排序纪律

## 设计判断

- 第一版只在编译层混排。
- 不做按天分组。
- 不做复杂 tie-break。
- 只要求 deterministic、可测试、system / compaction 共享。
