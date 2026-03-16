# Quickstart：Timestamped Memory Timeline Checkpoints

## 目标

让 `[MEMORY TIMELINE]` 和 compaction timeline 的 checkpoint 带短时间标记。

## 实现步骤

1. 先写失败测试：
   - system timeline 的 summary checkpoint 带短时间
   - system timeline 的 observation checkpoint 带短时间
   - compaction timeline 的 checkpoint 带短时间
   - synthetic 小整数时间戳仍回退无时间前缀
2. 再实现短时间格式化 helper
3. 接进：
   - `compiled-context.ts`
   - `compaction-context.ts`
4. 跑最小测试
5. 跑 `typecheck` 和 `build`

## 预期输出例子

之前：

```text
- [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md
- [research] 读取 requirements.csv 并发现 evidence_source 列缺失
```

之后：

```text
- [09:41] [summary] 之前的准备工作：已整理 smoke 前置条件并记录到 checklist.md
- [09:43] [research] 读取 requirements.csv 并发现 evidence_source 列缺失
```
