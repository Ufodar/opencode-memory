# opencode-continuity Roadmap

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

## v0.4.0 Continuity Injection

- `experimental.chat.system.transform`
- summary 优先注入
- recent observation 索引注入
- compaction 友好策略

## v0.5.0 Retrieval Surface

- `memory_search`
- `memory_details`
- 检索结果结构化返回

## v0.6.0 Storage & Ranking

- SQLite 真源
- vector/keyword hybrid ranking
- retention / cleanup
