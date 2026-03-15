# opencode-memory 架构说明

## 目标

`opencode-memory` 是一个面向 OpenCode 的通用工作记忆插件底座。

它要逼近的不是 `claude-mem` 的平台实现，而是它的四个核心机制角色：

1. 采集器
2. 压缩器
3. 回注器
4. 检索器
5. compaction 记忆保留

## 第一版角色映射

## 命名约定

- `SQLite*`
  - 具体后端实现，强调这是当前持久化绑定层
- `*Repository`
  - 单对象持久化边界：
    - observation
    - request anchor
    - summary
- `*Service`
  - 跨对象查询与组装边界
- `*Pipeline`
  - runtime 编排边界
- `*Handler`
  - 单类 OpenCode hook 的胶水编排边界
- `*Context`
  - 注入文本构造边界
- `memory/contracts.ts`
  - memory 领域边界
  - 放 backend-agnostic 结果类型和上层最小 store interfaces

### 采集器

- OpenCode 等价点：`tool.execute.after`
- 作用：把高价值工具调用转成 observation 候选并落库

### 压缩器

- 当前已经进入独立 worker 形态：
  - OpenCode plugin 入口只负责连接 worker
  - 真实编排、存储与检索都在 worker 进程内完成
  - 当前形态已经从 `plugin-internal pipeline` 变成更接近 `thin plugin -> worker`
- worker 内部当前负责：
  - observation capture
  - request anchor
  - summary 聚合
  - system context building
  - compaction context building
  - 同一 request anchor 可多次 checkpoint
  - checkpoint 可基于 phase 信号切分
  - summary 可选走 model-assisted，但必须可回退到 deterministic
  - model-assisted 输出必须经过归一化和约束收口
  - model-assisted 请求必须受 timeout 约束

### 回注器

- OpenCode 等价点：`experimental.chat.system.transform`
- 作用：把记忆结果注入到 system/background，而不是普通消息
- 当前策略：
  - summary-first
  - 仅补未被 summary 覆盖的 observation
  - 优先注入当前 session 记忆
  - 若当前 session 没有记忆，再回退到 project 记忆
  - 受 count 和 character budget 双重约束
  - observation 会带 phase，便于保留阶段语义

### 检索器

- 第一版工具面：
  - `memory_search`
  - `memory_timeline`
  - `memory_details`
- 当前策略：
  - `memory_search` summary-first
  - `memory_search` 未指定 `scope` 时默认 `session-first / project-fallback`
  - `memory_timeline` 围绕 summary / observation anchor 返回时间上下文
  - `memory_timeline` 未指定 `scope` 时默认 `session-first / project-fallback`
  - `memory_details` mixed details
  - `memory_search` 支持 `session / project` scope
  - `memory_search` 会过滤被返回 summary 覆盖的 observation
  - `memory_search` 在组内按命中强度与重要度做 deterministic ranking
  - internal memory tool 不进入记忆自身：
    - `memory_search`
    - `memory_timeline`
    - `memory_details`

### compaction 记忆保留

- OpenCode 等价点：`experimental.session.compacting`
- 作用：在会话 compaction 时，把记忆 checkpoint 显式追加到 compaction prompt
- 当前策略：
  - 复用与 system injection 相同的记忆选择纪律
  - 优先 recent summaries
  - 再补 recent unsummarized observations
  - observation 显式带 `phase` 前缀
  - 受独立 compaction budget 约束

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
  -> summary-first memory_search / timeline / mixed memory_details
injection
  -> summary-first system transform
  -> unsummarized observations only
  -> session-first / project-fallback selection
  -> count + character budget
compaction
  -> summary-first memory context
  -> unsummarized observations with phase
  -> separate compaction budget
runtime safety
  -> session-level idle reentry guard
runtime orchestration
  -> idle summary pipeline
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

- 不做业务特化记忆 schema
- 不做更复杂的 timeline 编排或图形化视图
- 不做复杂 reranking
- 不做团队知识库
- 不做 model-assisted phase classification

## 当前质量护栏

- `session.idle` summary 主链有 session 级重入保护
- `session.idle` summary 主链已抽成独立 pipeline，不再继续堆在 plugin 入口
- observation 主文本优先保留工具结果语义
- observation phase 已在 capture 时落盘，并暴露到 retrieval / timeline / details
- decision 判定已收紧，避免普通“生成/输出”措辞造成过早 checkpoint
- model-assisted summary 有 deterministic fallback，并新增 timeout
- memory internal tools 不会再次被 capture / retrieval / injection 吞回去
- store 初始化时会清洗 legacy internal-tool observation 与 raw `read` payload 噪声
- compaction 记忆保留已独立建模，不再只依赖正常对话时的 system injection
- worker 启动现在有独立 manager：
  - 分配本地端口
  - 启动 Bun 子进程
  - 做 health check
  - 暴露 HTTP client 给 plugin 入口
- worker lifecycle 第一版治理已落地：
  - 同 key worker 复用
  - plugin 启动时会先读取本地 worker 注册信息，优先恢复健康的已有 worker
  - 如果记录对应的 worker 是最近刚启动、暂时还没 ready，会先等待短窗口再决定是否放弃
  - 如果记录对应的 PID 已经不存在，会直接清掉 stale 注册信息
  - 恢复前会先扫描整个 worker 注册表，把死 PID 对应的旧记录清掉
  - 不健康 worker 自动替换
  - 已发出的 handle 通过代理层自动切到新 worker
  - 关闭时优先调用 worker 自己的 `/shutdown`，再回退到 PID kill
- worker 运行时当前已加入两层额外治理：
  - session 级 job 串行：
    - 同一 session 的 capture / summary / session-scoped query 先进入 worker 内部 scheduler
    - 避免同一会话内写入、summary、回查依赖 HTTP 到达顺序碰运气
  - worker HTTP timeout：
    - plugin -> worker 的请求有明确 timeout
    - health check 超时直接视为不健康
- run-mode summary fallback 已落地：
  - `chat.message` 进入时先尝试 flush 上一个 request 的 summary
  - 再记录新的 request anchor
  - 用来补 `session.idle` 在一次性 CLI 宿主中的不稳定性
- request anchor capture 当前也已加入一层边界：
  - 纯 memory 回查 prompt 不再写入 request history
  - 避免 `memory_search / memory_timeline / memory_details` 这类自查询请求不断污染 request anchor 链

## 当前局部重写进度

已完成第一阶段：

- `MemoryStore` 已收紧为 `SQLiteMemoryStore`
- SQLite 层已拆出：
  - `SQLiteMemoryDatabase`
  - `ObservationRepository`
  - `RequestAnchorRepository`
  - `SummaryRepository`
  - `MemoryRetrievalService`
- `session.idle -> summary` 已抽成 `runtime/pipelines/idle-summary-pipeline.ts`
- memory 领域 contracts 已抽出到：
  - `src/memory/contracts.ts`
- 当前已经完成的上层解耦：
  - `select-context`
  - `memory_search`
  - `memory_details`
  - `memory_timeline`
  - `idle-summary-pipeline`
  这些上层点已经依赖领域 contracts，而不是 SQLite 目录内的具体类型
- 当前已经完成的 runtime 抽离：
  - `chat-message-event`
  - `session-idle-event`
  - `tool-execute-after`
  - `system-transform`
  - `session-compacting`
- `index.ts` 当前已进一步收紧为 plugin composition root：
  - 启动 managed worker
  - 组装 handlers
  - 暴露 tools
- 当前最新的对齐点：
  - handler 已不再直接碰 store / pipeline
  - retrieval tool 也不再直接碰 store
  - 两者都先经过 worker HTTP client
  - worker 进程内部再统一进入 `MemoryWorkerService`
  - 这一步已经不仅是对齐 `claude-mem` 的 worker 角色，也开始对齐它的 worker 运行时边界

仍未完成的下一阶段：

- 继续把 context builder / summary orchestration 更彻底地收进 worker 内核
- 再决定是否需要更完整的 worker 生命周期治理：
  - 崩溃恢复
  - stale worker 清理
  - 更明确的启动/关闭策略
- 再考虑是否需要队列化或批处理，而不是让 plugin 入口直接逐请求等待

## 真实宿主验证补充

当前已经用本地 OpenCode 宿主完成 smoke test，确认：

- plugin 能被真实宿主加载
- plugin 能在真实宿主下拉起独立 memory worker 进程
- `memory_search` / `memory_timeline` / `memory_details` 会进入真实 tool surface
- `read` observation 会真实写入 SQLite
- `memory_timeline` 能在真实宿主返回最小时间上下文
- 加入 `experimental.session.compacting` 后，插件仍能被真实宿主正常加载与执行，不会破坏 tool surface

当前仍需记住的运行时边界：

- OpenCode 本地插件开发存在模块缓存现象
- 重新 build 不一定意味着当前宿主已经加载新代码
- 因此真实宿主验证应优先使用：
  - 新的本地插件文件名
  - 或新的 import query string
  - 或新的临时 workspace / runtime
