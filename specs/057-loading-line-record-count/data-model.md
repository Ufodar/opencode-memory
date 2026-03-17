# 数据模型：Loading Line Record Count

## 影响对象

- `ContextEconomicsLines`

## 变更

- `Loading` 行增加可见记录数
- 可见记录数 = `summaryCount + directObservationCount`

## 不变

- counts line 保持不变
- `Work investment` 保持不变
- `Your savings` 保持不变
- compaction context 继续不显示 economics
