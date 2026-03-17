# Research: Semantic Memory Timeline

## 决策 1：把 semantic timeline anchor resolution 放在 worker service，而不是 store

- **Decision**: 由 `memory-worker-service` 在 `getMemoryTimeline(query=...)` 时先尝试 semantic observation search，命中后再调用现有 `store.getMemoryTimeline(anchorID=...)`。
- **Rationale**: timeline 组装与窗口裁剪已经在 store 中稳定存在；这轮只补“query 如何找到更好的 observation anchor”，不值得把 embedding 依赖下沉到 store。
- **Alternatives considered**:
  - 直接修改 `MemoryRetrievalService.resolveTimelineAnchor()`：会把向量依赖拉进 store，扩大改动面。
  - 在 tool 层做 semantic anchor 解析：会让 plugin tool 理解 memory 业务流程，背离当前 worker 主控边界。

## 决策 2：query-based semantic timeline 只允许 observation 做自动 anchor

- **Decision**: semantic query 路径只接受 `observation` 结果作为自动 anchor。
- **Rationale**: `claude-mem` 的 `get_timeline_by_query` 也是先找到 observation，再围绕 observation 拉时间线；summary 更适合 snapshot/search 结果，不适合直接冒充 query timeline anchor。
- **Alternatives considered**:
  - 允许 summary 作为 semantic anchor：会让 query timeline 行为和显式 `anchor` 模式混淆，也会让时间线围绕 summary 展开得过粗。

## 决策 3：先复用已有 semantic search 管道，只加 kind 过滤

- **Decision**: 在现有 `searchSemanticMemoryRecords` 输入上增加 `kinds` 过滤，让 timeline query 可以请求 observation-only semantic results。
- **Rationale**: 当前向量索引、embedding、hydration 都已存在；这一轮只需要更精确地消费它们，不需要再起新的 semantic search service。
- **Alternatives considered**:
  - 新增独立 `searchSemanticTimelineAnchor()`：会重复 search path 与错误处理。
  - 直接拿现有 semantic search 结果里的第一条 observation：会受 summary-first 结果面影响，不够稳。

## 决策 4：保留当前 `session -> project` 范围回退

- **Decision**: 未显式指定 `scope=project` 时，先做 session semantic anchor 解析；未命中再回退 project semantic；若都失败再走当前文本路径。
- **Rationale**: 这和当前 `memory_search`、`memory_timeline` 的 scope 语义一致，也最符合现有用户心智。
- **Alternatives considered**:
  - 直接 project semantic：会丢掉当前 session-first 纪律。
  - semantic 失败后直接返回 null：会破坏 timeline 当前可用性。
