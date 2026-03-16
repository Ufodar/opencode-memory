# Quickstart：Chronological Memory Timeline

## 目标

让 `[MEMORY TIMELINE]` 和 compaction timeline 的 checkpoint 真正按时间混排。

## 实现步骤

1. 先写失败测试：
   - system timeline：observation 比 summary 更早时，先显示 observation
   - compaction timeline：同样顺序
2. 再实现统一 checkpoint 列表构建
3. 按 `createdAt` 升序排序
4. 保持现有 checkpoint 文本与时间前缀不变
5. 跑最小测试，再跑 `typecheck/build`

## 预期输出例子

之前：

```text
- [09:43] [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md
- [09:41] [research] 读取 requirements.csv 并补充时间线验证
```

之后：

```text
- [09:41] [research] 读取 requirements.csv 并补充时间线验证
- [09:43] [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md
```
