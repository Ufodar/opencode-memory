# opencode-continuity 局部重写设计

## 目标

这次不是整仓重写。

目标是：

1. 保留已经验证过的 continuity 主闭环
2. 把最集中的复杂度热点拆开
3. 让后续继续增强时，不再把复杂度继续堆进单个文件

## 当前应保留的部分

- `request / observation / summary` 三对象模型
- `summary-first retrieval`
- `summary-first injection`
- `compaction continuity`
- `memory_search -> memory_timeline -> memory_details`
- 现有测试资产

这些部分已经形成真实闭环，不值得推倒重来。

## 当前应局部重写的两块

### 1. storage / retrieval

当前问题集中在：

- [src/storage/sqlite/continuity-store.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/storage/sqlite/continuity-store.ts)

它现在同时承担：

- SQLite schema/init
- observation 保存和查询
- request anchor 保存和查询
- summary 保存和查询
- search ranking
- details 组装
- timeline 组装
- legacy cleanup

这不是方向错误，而是职责过度集中。

#### 重写目标

把 `ContinuityStore` 拆成四层：

1. `ObservationRepository`
   - observation 读写
2. `RequestRepository`
   - request anchor 读写
3. `SummaryRepository`
   - summary 读写
4. `RetrievalQueryService`
   - search / timeline / details
   - ranking
   - covered observation 去重

#### 拆完后的效果

- “数据保存” 和 “检索组装” 分开
- 后面继续加 ranking、scope、timeline 时，不再污染基础 repository

### 2. runtime summary pipeline

当前问题集中在：

- [src/index.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/index.ts)

它现在把这条链直接写在 plugin 入口里：

```text
session.idle
-> getLatestRequestAnchor
-> listObservationsForRequestWindow
-> selectCheckpointObservations
-> buildSummaryRecord
-> saveSummary
-> updateRequestAnchorCheckpoint
```

这条链本身没错，但放在入口里会让后续：

- checkpoint 规则增强
- phase 稳定性增强
- model-assisted summary 增强
- error handling / timeout / metrics

都继续堆在 `index.ts`。

#### 重写目标

把这条链抽成独立 service，比如：

- `RuntimeSummaryPipeline`

由它单独负责：

1. 读取 request anchor
2. 读取 request window observations
3. 选择 checkpoint observations
4. 生成 summary
5. 保存 summary
6. 推进 checkpoint

`index.ts` 只保留：

- hook 接线
- 调 service
- 记录日志

#### 拆完后的效果

- plugin 入口重新变薄
- 以后 checkpoint / phase 规则增强时，改的是 pipeline，不是入口

## 当前不建议重写的部分

### observation capture

- [src/runtime/hooks/tool-after.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/runtime/hooks/tool-after.ts)

这块还有继续优化空间，但它现在不是复杂度黑洞。

### injection

- [src/runtime/injection/system-context.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/runtime/injection/system-context.ts)
- [src/runtime/injection/compaction-context.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/runtime/injection/compaction-context.ts)

这两块现在职责清楚，先不动。

### model-assisted summary

- [src/services/ai/model-summary.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/src/services/ai/model-summary.ts)

这里现在还不是最大复杂度源。
更好的顺序是等 pipeline 抽出来后，再决定要不要继续做 provider abstraction。

## 推荐顺序

### 第一步

先拆 `storage / retrieval`

原因：

- 它是当前最集中的复杂度热点
- 行数最多
- 同时污染了 retrieval 和 data persistence 两层

### 第二步

再抽 `runtime summary pipeline`

原因：

- 它会决定后面 phase/checkpoint 稳定性还能不能继续往前做

### 第三步

完成局部重写后，再重新判断：

- 是否还需要 provider abstraction
- 是否要继续做更强 phase/checkpoint 规则
- 是否值得进入 worker 化

## 最短结论

这仓当前最好的路线不是：

- 继续加功能
- 也不是整仓重写

而是：

1. 保留主闭环
2. 先拆 `store`
3. 再抽 `idle summary pipeline`
