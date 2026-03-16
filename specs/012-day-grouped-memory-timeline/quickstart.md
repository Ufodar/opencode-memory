# Quickstart：Day Grouped Memory Timeline

## 目标

让跨天的 timeline checkpoint 带日期分组行。

## 实现步骤

1. 先写失败测试：
   - system timeline 跨两天时插入 `[day] YYYY-MM-DD`
   - compaction timeline 同样插入
   - 单天 timeline 不插入多余分组行
2. 再在 timeline 编译阶段加日期切换检测
3. 保持 `011` 的时间混排不变
4. 跑最小测试，再跑 `typecheck/build`
