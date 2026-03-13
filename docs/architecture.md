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
- 当前仍是 `plugin-internal pipeline`，不是 `thin hook -> worker`
- 先在插件内部完成：
  - observation capture
  - request anchor
  - summary 聚合
  - 同一 request anchor 可多次 checkpoint
  - checkpoint 可基于 phase 信号切分
  - summary 可选走 model-assisted，但必须可回退到 deterministic
  - model-assisted 输出必须经过归一化和约束收口
  - model-assisted 请求必须受 timeout 约束

### 回注器

- OpenCode 等价点：`experimental.chat.system.transform`
- 作用：把 continuity 结果注入到 system/background，而不是普通消息
- 当前策略：
  - summary-first
  - 仅补未被 summary 覆盖的 observation
  - 优先注入当前 session continuity
  - 若当前 session 没有 continuity，再回退到 project continuity
  - 受 count 和 character budget 双重约束

### 检索器

- 第一版工具面：
  - `memory_search`
  - `memory_details`
- 当前策略：
  - `memory_search` summary-first
  - `memory_details` mixed details
  - `memory_search` 支持 `session / project` scope
  - `memory_search` 会过滤被返回 summary 覆盖的 observation
  - `memory_search` 在组内按命中强度与重要度做 deterministic ranking

## 当前已落地的最小数据链

```text
tool.execute.after
  -> candidate rule
  -> observation record
  -> SQLite persistence
chat.message
  -> request anchor
session.idle
  -> request checkpoint observations
  -> summary aggregation
  -> summary persistence
  -> request anchor checkpoint updated
retrieval
  -> summary-first memory_search / mixed memory_details
injection
  -> summary-first system transform
  -> unsummarized observations only
  -> session-first / project-fallback selection
  -> count + character budget
runtime safety
  -> session-level idle reentry guard
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
- 不做 model-assisted phase classification

## 当前质量护栏

- `session.idle` summary 主链有 session 级重入保护
- observation 主文本优先保留工具结果语义
- decision 判定已收紧，避免普通“生成/输出”措辞造成过早 checkpoint
- model-assisted summary 有 deterministic fallback，并新增 timeout
