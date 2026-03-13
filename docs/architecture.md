# opencode-continuity 架构说明

## 目标

`opencode-continuity` 是一个面向 OpenCode 的通用 memory continuity 插件底座。

它要逼近的不是 `claude-mem` 的平台实现，而是它的四个核心机制角色：

1. 采集器
2. 压缩器
3. 回注器
4. 检索器

## 第一版角色映射

### 采集器

- OpenCode 等价点：`tool.execute.after`
- 作用：把高价值工具调用转成 observation 候选并落库

### 压缩器

- 第一版不做外部 worker
- 先在插件内部完成：
  - observation capture
  - request anchor
  - summary 聚合

### 回注器

- OpenCode 等价点：`experimental.chat.system.transform`
- 作用：把 continuity 结果注入到 system/background，而不是普通消息
- 当前策略：
  - summary-first
  - 仅补未被 summary 覆盖的 observation

### 检索器

- 第一版工具面：
  - `memory_search`
  - `memory_details`
- 当前策略：
  - `memory_search` summary-first
  - `memory_details` mixed details

## 当前已落地的最小数据链

```text
tool.execute.after
  -> candidate rule
  -> observation record
  -> SQLite persistence
chat.message
  -> request anchor
session.idle
  -> request window observations
  -> summary aggregation
  -> summary persistence
  -> request anchor summarized
retrieval
  -> summary-first memory_search / mixed memory_details
injection
  -> summary-first system transform
  -> unsummarized observations only
```

## 数据流

```text
tool.execute.after
  -> observation candidate
  -> observation record
  -> summary aggregator (later)
  -> system injection
  -> layered retrieval
```

## 当前刻意不做的事

- 不做业务特化 memory schema
- 不做外部 worker
- 不做 timeline
- 不做复杂 reranking
- 不做团队知识库
