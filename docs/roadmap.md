# opencode-memory Roadmap

## v0.1.0 Bootstrap

- 独立仓库初始化
- MIT 许可
- OpenCode plugin 最小骨架
- observation / summary 基本类型
- 文档与实现计划

## v0.2.0 Observation Pipeline

- `tool.execute.after` 候选筛选
- observation SQLite 存储接口
- 输入/输出摘要规则
- 基础 tags / importance

## v0.3.0 Summary Aggregation

- observation batch -> summary
- request anchor
- phase tag
- summary 触发策略

## v0.4.0 Memory Injection

- `experimental.chat.system.transform`
- summary 优先注入
- recent observation 索引注入
- 已被 summary 覆盖 observation 的去重
- compaction 友好策略

## v0.5.0 Retrieval Surface

- `memory_search`
- `memory_details`
- 检索结果结构化返回
- summary-first 检索顺序

## v0.6.0 Storage & Ranking

- SQLite 真源
- session / project scope 控制
- injection count / character budget
- vector/keyword hybrid ranking
- retention / cleanup

## v0.7.0 Timeline Retrieval

- `memory_timeline`
- query / anchor 双入口
- summary / observation 混合时间视图
- covered observation 默认去重，但允许 anchor 保留
- 与 `search -> timeline -> details` 渐进检索纪律对齐

## v0.8.0 Phase & Compaction Memory

- observation phase 落盘
- bash 动作 phase 分类
- retrieval / timeline / details 暴露 phase
- `experimental.session.compacting` memory context
- compaction summary-first + unsummarized observations
