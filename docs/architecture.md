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
- 当前补充策略：
  - `read` 工具优先从正文里提取 deterministic semantic 摘要
  - observation model 只是可选增强层
  - 即使模型失败，也保留 deterministic trace / evidence

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
  - system context 已从平铺列表升级为结构化 section：
    - `[LATEST SESSION SNAPSHOT]`
    - `[MEMORY TIMELINE]`
    - `[RESUME GUIDE]`
    - `[PREVIOUSLY]`
  - `[MEMORY TIMELINE]` 现在会同时承载：
    - older summary checkpoint
    - unsummarized observation checkpoint
  - system context header 现在还会补一条：
    - `[TOKEN KEY] Read=current reading cost | Work=prior work investment`
  - older summary 与 unsummarized observation 会先汇成统一 checkpoint 列表，再按 `createdAt` 升序混排
  - older summary checkpoint 会优先保留 request 语义：
    - `请求概述：结果概述`
    - request 缺失时才退回 outcome-only
  - timeline checkpoint 现在会优先带短时间前缀：
    - `- [09:41] [summary] ...`
    - `- [09:43] [research] ...`
    - synthetic 小整数时间戳不显示前缀，保持兼容
  - 当 timeline 跨越多个自然日时，会先插入：
    - `[day] YYYY-MM-DD`
    再列出当天 checkpoint，帮助恢复“昨天做了什么，今天又做了什么”
  - 同一天内的 observation checkpoint 现在会继续按主文件插入：
    - `[file] brief.txt`
    - `[file] checklist.md`
  - summary checkpoint 不进入文件分组，但会打断当前文件分组
  - 当 `[file] 文件名` 分组线已经存在时，同一 observation 行不再重复渲染 `files:` hint
  - system context 的 observation 主行现在还会直接补：
    - `Read ~X | Work ~Y`
    - 不再必须展开后才知道这条 observation 的局部 token 价值
  - 最近几条关键 observation 会继续展开成多行 checkpoint：
    - 主行保留时间 / phase / curated headline
    - detail line 只从现有 observation 字段提炼 `Result` / `Tool` / `Evidence`
    - system context 下的 expanded detail 还会补：
      - `Tokens: Read ~X | Work ~Y`
    - 更旧 observation 仍保持单行
  - `RESUME GUIDE` 已优先消费 semantic observation，而不是原始 `read: 路径`
  - context builder 现在还会做 deterministic 编译：
    - 开头会先插入 `[CONTEXT INDEX]` section
    - section 只出现在 system context，不进入 compaction context
    - section 会先明确：
      - 这份 index 覆盖 summaries / phases / tools / files / tokens
      - 这份 memory index 通常已经足够继续工作
      - 默认先信这份 index，再决定是否回读代码或历史
      - 只有缺证据、缺实现细节、缺过去决策理由时，才继续下钻
      - 在展开工具 bullet 前，还会先补一条导语：
        - `When you need implementation details, rationale, or debugging context:`
    - 正常预算下，section 会把三种工具说明拆成独立 bullet：
      - `Fetch by ID: memory_details(visible IDs) for record detail`
      - `Expand a checkpoint window: memory_timeline(checkpoint)`
      - `Search history: memory_search(decisions, bugs, deeper research)`
    - 低预算时，会回退到单行压缩版，避免挤掉真正的 timeline 内容
    - latest summary 会先编译成 `Current Focus / Learned / Completed / Next`
    - `Learned` 只来自 latest summary 覆盖的 observation 证据
    - older summaries 会被压成更短的 summary checkpoint 并进入统一 timeline
    - timeline observation 会被压成短 checkpoint
    - resume guide 会优先输出短动作提示
  - `RESUME GUIDE` 当前由 deterministic 规则生成，不依赖额外模型调用
  - `Previously` 当前来自 plugin 侧实时读取的最后一条 assistant 文本：
    - 不写入 SQLite
    - 不参与 summary / observation 持久化
    - 只在构建 system context 时作为可选 handoff 文本传给 worker

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
  - `memory_details` observation detail 已稳定暴露结构化 evidence：
    - `workingDirectory`
    - `filesRead`
    - `filesModified`
    - `command`
  - `memory_timeline` observation item 已稳定暴露最小 evidence 视图
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
  - observation 会追加精简 evidence hint：
    - `files: ...`
    - `cmd: ...`
  - summary checkpoint 与 unsummarized observation 会按统一时间线混排
  - 当 checkpoint 跨越多个自然日时，会插入 `[day] YYYY-MM-DD` 分组线
  - observation checkpoint 有主文件线索时，会继续插入 `[file] 文件名` 分组线
  - 当文件分组线已经存在时，不再重复渲染同样的 `files:` hint
  - 受独立 compaction budget 约束

## 当前已落地的最小数据链

```text
tool.execute.after
  -> candidate rule
  -> enqueue observation job
  -> SQLite pending_jobs
  -> worker session queue
  -> observation record
  -> SQLite persistence
chat.message
  -> run-mode summary flush fallback
  -> enqueue request anchor job
  -> SQLite pending_jobs
  -> worker session queue
  -> request anchor
session.idle
  -> enqueue summary job
  -> SQLite pending_jobs
  -> worker session queue
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
  - worker 进程会定时刷新自己的 registry `updatedAt`
  - worker 优雅关闭时会主动删除自己的 registry 记录
  - 多个 plugin 进程并发启动时，会先竞争 spawn lock；未拿到锁的一方会等待 peer 恢复/启动结果，避免重复 spawn
  - worker `/health` 会显式返回当前版本；recover 阶段若发现版本不匹配，会优雅关闭旧 worker 并触发新启动
  - 不健康 worker 自动替换
  - 已发出的 handle 通过代理层自动切到新 worker
  - 关闭时优先调用 worker 自己的 `/shutdown`，再回退到 PID kill
- worker 运行时当前已加入两层额外治理：
  - capture quick-ack：
    - plugin -> worker 的 request anchor / observation capture 已改成“先接收，再排队”
    - plugin 不再同步等待 capture 真正完成
    - 更接近 `claude-mem` 的 hook 提交形态
  - summary quick-ack：
    - plugin -> worker 的 `session.idle` / flush summary 请求已改成“先接收，再排队”
    - plugin 不再同步等待 summary 真正聚合与写库
    - 更接近 `claude-mem` 的 summarize queued 形态
  - pending queue 持久化：
    - request anchor / observation / session-idle 先写入 SQLite `pending_jobs`
    - 不再只依赖进程内存队列
    - worker 重启时会先把 `processing` 重置回 `pending`
    - 再按 session 自动恢复未完成 job
  - failed 状态与重试上限：
    - 同一个坏 job 不会无限次在 `pending -> processing` 之间自旋
    - 达到上限后会标成 `failed`
    - worker 会继续处理同一 session 后面的正常 job
  - failed queue 可见与可恢复：
    - worker 现在可返回 queue depth / isProcessing
    - worker 现在可返回 processing / failed job 列表
    - processing job 会标出是否 stale
    - failed job 与 stuck processing job 都可手动重试回 `pending`
    - 不再只能靠直接查 SQLite 判断失败或卡死队列状态
  - queue 状态现在也会主动打日志：
    - enqueue / start / complete / fail / resume 都会自动记录
    - 日志里会直接带 `counts`、`queueDepth`、`isProcessing`
    - 不再只能靠手动查询 tool 才知道 worker 是否正在忙
  - queue 状态现在也会维护结构化快照：
    - worker 会把最新状态写到 `worker-status.json`
    - `memory_queue_status` 现在会把这份 `workerStatus` 一起返回
    - 后续如果要接 UI、宿主监控或更强的 smoke，不需要再解析日志
  - worker 现在也会持续推送结构化实时事件：
    - `GET /stream`
    - 初始先推：
      - `connected`
      - `processing_status`
    - 后续继续推：
      - `processing_status`
      - `new_observation`
      - `new_summary`
    - 现在已经有正式的流读取辅助，可供后续 UI、watcher 或宿主验证复用
  - worker 现在也会提供“初始快照”：
    - `POST /stream/snapshot`
    - 新消费者不只看到连接后的新事件
    - 也能先拿到当前 queue 状态、最近 summary 和最近 observation
- 当前也有显式上下文预览工具：
    - `memory_context_preview`
    - 用来直接查看当前 system injection 内容
    - 现在会与真实 system injection 共享同一套结构化 section 输出
- evidence-aware memory 当前已落地到三条消费链：
  - detail：
    - `memory_details`
    - `coveredObservations`
  - timeline：
    - observation item 最小 evidence 视图
  - context：
    - system / compaction 中的短 evidence hint
- stale processing 自愈：
    - `pending_jobs` 现在会记录 `started_processing_at`
    - claim 下一条 job 前，会先把超过阈值的 `processing` 重置回 `pending`
    - 不再只依赖 worker 重启来恢复卡死 job
  - session 级 job 串行：
    - 同一 session 的 capture / summary / session-scoped query 先进入 worker 内部 scheduler
    - 避免同一会话内写入、summary、回查依赖 HTTP 到达顺序碰运气
  - worker HTTP timeout：
    - plugin -> worker 的请求有明确 timeout
    - health check 超时直接视为不健康
    - 长连接打开成功后会清掉初始 timeout，不会再把 SSE 自己中断
- run-mode summary fallback 已落地：
  - `chat.message` 进入时先尝试 flush 上一个 request 的 summary
  - 再记录新的 request anchor
  - 用来补 `session.idle` 在一次性 CLI 宿主中的不稳定性
- request anchor capture 当前也已加入一层边界：
  - 纯 memory 回查 prompt 不再写入 request history
  - 避免 `memory_search / memory_timeline / memory_details` 这类自查询请求不断污染 request anchor 链
  - `memory_context_preview` 也属于这类“只看现状、不推进正式工作”的请求
- session 收口语义进一步收紧：
  - `chat.message` 在 `completeSession()` 成功后，会先把该 session 从 tracker 里移掉
  - 只有真的生成了新的 request anchor，才会重新标记为 active
  - 只有真的落下了新的 observation，tool handler 才会重新标记 active
  - `system transform`、`session compacting`、`session.idle` 这些读路径或收尾路径，不再单独把 session 标成 active
  - 这样最终 `tracker` 更接近“仍有未收口工作”的集合，而不是“最近碰到过的 session”集合
- host smoke 现在分出一条显式的 `singleRunFlushChain`
  - 不靠后续 prompt
  - 只看第一次 `opencode run` 退出后，worker 状态和 SQLite 是否已经完成 session 收口
  - 这条链更贴近 `claude-mem` 的 `Stop` / `session-complete` 验证思路

## 真实宿主实时流验证

- 当前 host smoke 已不只验证：
  - 写入链
  - 回查链
  - 初始快照链
  - worker 跨 run 复用
- 也会验证：
  - 通过 worker 注册表找到当前 worker
  - 先调用 `POST /stream/snapshot`
  - 确认新连接能先拿到当前 queue 状态和最近记忆
  - 通过 worker 注册表找到当前 worker
  - 连上 `GET /stream`
  - 再触发一次真实 `opencode run`
  - 确认 `new_observation` 会被实时推出来

这一步的意义不是“多一条测试”，而是把“初始快照 + 实时流”这套消费面，一起推进到了真实 OpenCode 宿主验证。

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

## 2026-03-16：context builder footer 当前能力

- system context 现在除了 `[CONTEXT ECONOMICS]` 之外，还会在末尾追加：
  - `[CONTEXT VALUE]`
- 这条 footer 的作用不是重复 economics 数字，而是把当前注入记录压成一句价值判断：
  - 当前 index 已经压缩了多少 covered observations
  - 当前还有多少 checkpoints / direct observations
  - 应先信任当前 index，再决定是否重读过去工作
- 现在这条 footer 还会继续补一条量化句：
  - `Access ~X tokens of prior work for just ~Y tokens of reading.`
- 现在这条 footer 还会继续补一条动作提醒：
  - `If this index is still not enough, use memory_details with visible IDs before re-reading history.`
- 这条 footer 只出现在 system context，不进入 compaction context

## 2026-03-16：timeline observation 行当前能力

- system context 的 observation 主行现在除了：
  - phase
  - visible ID
  - file 分组
- 还会直接带一个短 tool/type tag：
  - `{read}`
  - `{write}`
  - `{bash}`
- 这层 tag 的作用不是替代 detail line，而是让折叠 observation 也能快速暴露工具来源
- `[TIMELINE KEY]` 现在也会同步解释：
  - `{tool}=source tool`
- compaction context 继续不带这条 header 说明

## 2026-03-16：expanded observation detail 当前能力

- system context 的 expanded observation detail 当前除了：
  - `Result`
  - `Tool`
  - `Evidence`
- 还会继续显示一条局部 token hint：
  - `Tokens: Read ~X | Work ~Y`
- 这条 hint 的作用不是替代全局 `[CONTEXT ECONOMICS]`
- 而是让单条 expanded observation 也能暴露：
  - 读这条记录大概要花多少
  - 它代表多少过去工作
- 这条 hint 当前只出现在 system context 的 expanded observation
- compaction context 继续不带这条 hint

## 2026-03-16：latest snapshot 当前能力

- latest snapshot 当前已不只包含：
  - `Current Focus`
  - `Learned`
  - `Completed`
  - `Next`
- 在存在稳定 evidence 时，还会新增：
  - `Investigated`
- `Investigated` 的当前来源保持 deterministic：
  - latest summary 覆盖的 observation trace
  - 优先文件线索
  - 其次命令线索
- system context 与 compaction context 复用同一套 latest snapshot 字段策略
- latest snapshot 现在还有 freshness gating：
  - 如果 direct observation 比 latest summary 更新
  - 就不再渲染 latest snapshot
  - stale summary 会回到 timeline
- 再决定是否需要更完整的 worker 生命周期治理：
  - 崩溃恢复
  - stale worker 清理
  - 更明确的启动/关闭策略
- 继续补 pending queue 的失败状态、重试上限与队列可观测性
- 继续补 failed queue 的查询、人工重试和恢复入口
- 继续补 stuck processing 的自愈，而不是只在 worker 重启时恢复
- 继续补 queue 状态的更强可观测性，而不是只停在 tool 返回值
- 继续补 stuck processing / failed queue 的更细粒度人工干预入口
- 继续评估是否需要比日志更主动的状态暴露形态
- 继续评估是否需要把结构化状态从文件/手动查询进一步推进到更持续的推送形态

## 2026-03-16：context builder header 当前能力

- system context header 当前已包含：
  - `Project: ... | Generated: ...`
  - `[CONTEXT INDEX]`
  - `[TIMELINE KEY]`
  - `[CONTEXT ECONOMICS]`
- 其中 `[CONTEXT ECONOMICS]` 当前已经包含两层：
  - 真实 coverage 计数：
    - summaries
    - direct observations
    - covered observations
  - deterministic token estimate：
    - `Loading`
    - `Work investment`
    - `Your savings`
- token estimate 当前只依赖已有 summary / observation 字段，不新增 schema
- compaction context 明确不复用这些运行时 header section
- system context 当前还会直接暴露可见 record ID：
  - snapshot 中显示 `Summary ID: #sum_*`
  - timeline 中显示 `#sum_* / #obs_*`
- 这样 `memory_details(ids)` 可以直接顺着当前 context 下钻

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
