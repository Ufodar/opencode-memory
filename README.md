# opencode-memory

OpenCode 的通用工作记忆插件底座。

## 定位

这个项目是一个独立的 MIT 开源仓库，方向是：

- 面向 OpenCode
- 专注工作记忆
- 逼近 `claude-mem` 的核心机制角色
- 不直接夹带业务领域逻辑

第一阶段只做通用能力：

- observation 级采集
- summary 聚合
- system/background 注入
- 分层检索
- compaction 记忆保留

第一阶段不做：

- 标书或其他业务特化记忆
- 团队知识库
- 复杂 timeline / reranking

## 设计原则

1. 角色等价，不做平台照搬
2. 先 observation，再 summary
3. 先通用记忆底座，再叠业务层
4. 保持 MIT 独立仓，避免混入 AGPL 代码

## 仓库结构

```text
src/
  index.ts
  memory/
    contracts.ts
  config/
  testing/
  runtime/
    handlers/
    hooks/
    injection/
    pipelines/
  memory/
    observation/
    summary/
  storage/
  tools/
  services/
docs/
  architecture.md
  roadmap.md
  plans/
```

## 当前状态

当前仓库已完成：

- 独立 git 仓库初始化
- MIT 许可
- `spec-kit` 工作流已接入：
  - `.opencode/command/speckit.*`
  - `.specify/scripts/bash/*`
  - `specs/<feature>/spec.md|plan.md|tasks.md`
- OpenCode plugin 最小骨架
- 核心 observation / summary 类型
- SQLite observation 持久化
- request anchor 持久化
- deterministic summary aggregation
- 同一 request anchor 已支持多 checkpoint summary
- request checkpoint 已支持第一版 phase-aware 切分
- observation 已带 phase：
  - `research`
  - `planning`
  - `execution`
  - `verification`
  - `decision`
- `memory_search` / `memory_details` 已支持 summary-first 检索与 mixed details
- `memory_timeline` 已支持围绕 summary / observation anchor 查看时间上下文
- SQLite 存储层已开始按长期架构目标拆分：
  - `SQLiteMemoryStore`
  - `SQLiteMemoryDatabase`
  - `ObservationRepository`
  - `RequestAnchorRepository`
  - `SummaryRepository`
  - `MemoryRetrievalService`
- `memory_search` / `memory_timeline` 在未显式指定 `scope` 时已默认：
  - 先查当前 session
  - 再回退 project
- `memory_search` 已过滤被返回 summary 覆盖的 observation
- `memory_search` 已具备第一版 deterministic ranking
- summary 已支持可选 model-assisted 生成，并保留 deterministic fallback
- model-assisted summary 已加入输出归一化、长度约束与弱 nextStep 过滤
- model-assisted summary 已加入 timeout，provider 卡住时会自动回退
- system injection 已升级为 summary-first，并自动过滤已被 summary 覆盖的 observation
- compaction 已支持记忆上下文注入：
  - 优先注入 recent summaries
  - 再补 recent unsummarized observations
  - 帮助 OpenCode compaction 保留记忆 checkpoint
- retrieval 已支持 `session / project` scope
- retrieval tools 已开始内建 `session-first / project-fallback` 默认行为，减少 agent 端判断负担
- system injection 已支持 session-first / project-fallback 选择
- system injection 已支持 count + character budget
- system context 头部当前已从标签式改成标题式：
  - `# [project] recent context, ...`
- `[TOKEN KEY]` 当前已从单行缩写改成两条完整说明：
  - `Read` = 现在读懂这一条大概要花多少 token（cost to learn it now）
  - `Work` = 过去为产出这一条已经投入了多少工作 token（research / building / deciding）
- observation 主文本已优先保留工具结果语义，而不是只写成 `tool: title`
- `read` observation 已升级为 semantic memory record：
  - 优先从文件正文提取高信息量片段
  - 避免把原始 `<path>/<content>` payload 直接塞进 `content`
  - summary / resume 已优先消费这些语义记录
  - context builder 已继续升级为 curated working index：
  - 开头现在会先给一小段 memory index guide，告诉模型：
    - 这份 snapshot 是 recent working index
    - `[CONTEXT INDEX]` 首句现在会直接把这份 index 写成：
      - `This semantic index (summaries, phases, tools, files, and tokens) is usually sufficient to understand past work.`
    - 默认先信这份 index，再决定是否回读代码或历史
    - 只有缺证据、缺实现细节、缺过去决策理由时，才继续下钻
    - 正常预算下，三种工具说明会拆成独立 bullet：
      - 在这些 bullet 前会先有一条导语：
        - `When you need implementation details, rationale, or debugging context:`
      - `Fetch by ID: memory_details(visible IDs) for record detail`
      - `Expand a checkpoint window: memory_timeline(checkpoint)`
      - `Search history: memory_search(decisions, bugs, deeper research)`
      - 这些 drilldown bullet 之后，才会落：
        - `Trust this index over re-reading code for past decisions and learnings.`
    - 低预算时，这三种说明会回退到单行压缩版，避免把真正的 timeline 挤掉
  - older summaries 现在会进入 `MEMORY TIMELINE`，作为 summary checkpoint
  - `MEMORY TIMELINE` 会同时承载：
    - summary checkpoint
    - observation checkpoint
  - summary checkpoint 现在会优先编译成：
    - `请求概述：结果概述`
    - request 缺失时才退回 outcome-only
  - timeline checkpoint 现在会优先带短时间前缀：
    - `- [09:41] [summary] ...`
    - `- [09:43] [research] ...`
    - synthetic 小整数时间戳仍回退为无时间前缀
  - older summary 与 unsummarized observation 现在会按 `createdAt` 混排，而不是先 summary 再 observation
  - 当 timeline checkpoint 跨越多个自然日时，现在会先插入：
    - `[day] YYYY-MM-DD`
    再列出当天的 checkpoint
  - 同一天内的 observation checkpoint 现在还会按主文件插入：
    - `[file] brief.txt`
    - `[file] checklist.md`
    summary checkpoint 不进入文件分组，但会打断文件分组
  - 当 `[file] 文件名` 已经出现时，observation 行不再重复显示同样的 `(files: ...)`
  - system context 的 observation 主行现在还会直接补：
    - `Read ~X | Work ~Y`
    - 不再必须展开后才知道这条 observation 的局部 token 价值
  - 最近几条关键 observation 现在会展开成多行条目，而不是永远只有一行：
    - 主行继续保留 timeline checkpoint
    - detail line 会补充 `Result` / `Tool` / `Evidence`
    - system context 下的 expanded detail 现在还会补：
      - `Tokens: Read ~X | Work ~Y`
    - 更旧 observation 仍保持单行，避免 timeline 重新膨胀
  - system context header 现在还会补一条：
    - `[TOKEN KEY] Read=current reading cost (cost to learn it now) | Work=prior work investment (research, building, deciding)`
  - `RESUME GUIDE` 会优先输出短动作提示，而不是重复整条 summary
  - latest summary 现在还会被编译成 `[LATEST SESSION SNAPSHOT]`
    - `Investigated`
    - `Learned`
    - `Completed`
    - `Next Steps`
  - 当前 session 若已有 assistant 文本回复，system context 末尾现在还会追加：
    - `[PREVIOUSLY]`
    - 用 `A:` 前缀明确表达“上一次 assistant 停在了哪里”
    - 该内容来自 OpenCode session message，而不是数据库
  - 当 latest summary 已被 snapshot 吸收后，它不会再重复出现在 timeline 或单独的 summary section
- `session.idle` summary 主链已加入 session 级重入保护
- `session.idle -> summary` 主链已从 plugin 入口抽成独立 `pipeline`
- memory 领域 contracts 已开始独立：
  - `src/memory/contracts.ts`
  - retrieval / injection / idle summary pipeline 已依赖最小接口
  - 上层不再直接绑定 SQLite 目录内的结果类型
- runtime handlers 已开始独立：
  - `chat-message-event`
  - `session-idle-event`
  - `tool-execute-after`
  - `system-transform`
  - `session-compacting`
- 已新增独立 `memory worker` 运行时：
  - plugin 入口只负责启动和连接 worker
  - worker 进程内部统一承接：
    - request anchor capture
    - observation capture
    - idle summary
    - injection selection
    - system / compaction context building
    - retrieval fallback
  - 当前 plugin 主链已经变成：
    - 启动 managed worker
    - 组装 handlers
    - 暴露 tools
- worker 当前以本地 Bun 子进程启动：
  - manager：`src/worker/manager.ts`
  - server：`src/worker/server.ts`
  - client：`src/worker/client.ts`
  - entry：`src/worker/run-memory-worker.ts`
- worker lifecycle 第一版治理已落地：
  - 同一项目路径 + database 路径下复用同一个 worker 进程
  - 跨多次 `opencode run` 会先尝试从本地注册文件恢复已有 worker
  - 对最近刚启动但暂时还没 health 的 worker，会先等待短窗口，不会立刻判死
  - PID 已死的 stale 注册记录会在恢复阶段直接清掉
  - 恢复前会先扫描整个 worker 注册表，把死 PID 对应的旧记录清掉
  - worker 运行时会周期性刷新注册记录时间戳，优雅关闭时会主动删除自己的注册记录
  - 多个 plugin 进程几乎同时启动时，会先通过 spawn lock 协调，避免重复拉起同一个 worker
  - recover 旧 worker 时会先做版本握手；如果 worker 版本和当前 plugin 不一致，会先关旧 worker 再起新 worker
  - 旧 worker 不健康时自动替换
  - 已发出的 handle 会通过代理对象自动切到新 worker
- 关闭时会优先走 worker 自己的 `/shutdown`，失败后才回退到 PID kill
- worker 现在会跨多次 `opencode run` 复用，而不是每次 run 都重启
- worker 会在长时间无活动后自动自关，避免后台常驻进程越积越多
- worker 状态快照已按 `projectPath + databasePath` 分文件，不再互相覆盖
- host smoke 现在会单独验证：
  - 单次 run 退出后，是否不依赖下一条 prompt 也能完成 session 收口
  - `singleRunFlushChain`
- session 收口后的本地 active tracker 现在更接近 `claude-mem` 的 `session-complete` 语义：
  - 纯 memory 回查 prompt 不再保留 active session
  - `system transform`
  - `session compacting`
  - `session.idle`
  - 未真正落 observation 的 tool 调用
  都不会再把已收口 session 重新标活
- worker 内部已加入按 `sessionID` 串行的 job 调度：
  - 同一 session 的 capture / summary / session-scoped retrieval 不再并发直进
  - 不同 session 仍可并发
- request anchor / observation capture 已改成异步 quick-ack：
  - plugin 侧不再等待 capture 真正落库后才继续
  - worker HTTP 层先接收并入 session 队列
  - 真正写入在 worker 内部异步完成
  - 这一层已经更接近 `claude-mem` 的 `hook -> worker` ingestion 形态
- summary 触发也已改成异步 quick-ack：
  - plugin 侧不再等待 summary 真正生成完成
  - worker HTTP 层先接收 `session.idle` / flush 请求并入 session 队列
  - 真正的 summary 聚合与落盘在 worker 内部异步完成
  - 这一层继续向 `claude-mem` 的 `Stop -> summarize queued` 形态靠拢
- worker ingestion 已加入持久化 pending queue：
  - request anchor / observation / session-idle job 会先写入 SQLite `pending_jobs`
  - 不再只依赖 worker 进程内存队列
  - worker 重启时会先把 `processing` job 重置回 `pending`
  - 再自动恢复未完成 session 的 job
  - 这一层继续向 `claude-mem` 的“先持久化，再处理”队列形态靠拢
- pending queue 已加入失败状态与重试上限：
  - 同一个 job 不会无限次回到 `pending`
  - 达到上限后会标成 `failed`
  - 不再继续堵住同一 session 后面的正常 job
  - 这一层继续向 `claude-mem` 的“poison message 不无限自旋”队列形态靠拢
- pending queue 现在也已可见、可手动恢复：
  - 新增 `memory_queue_status`
  - 新增 `memory_queue_retry`
  - queue depth / isProcessing 现在也会直接暴露出来
  - processing job 现在也能看见，并会标出是否 stale
  - stuck processing job 现在也能手动放回 `pending`
  - 失败 job 不再只能静默留在 SQLite 里
  - 这一层继续向 `claude-mem` 的“失败队列可见、可重试”恢复路径靠拢
- worker 现在也会主动打印 queue 变化日志：
  - enqueue / start / complete / fail / resume 都会自动打日志
  - 日志里会直接带：
    - `queueDepth`
    - `isProcessing`
    - `counts`
  - 不再只能靠手动调用 `memory_queue_status` 判断 worker 是否正在忙
- worker 现在也会维护结构化状态快照：
  - 默认写到 `~/.opencode-memory/data/worker-status.json`
  - `memory_queue_status` 现在会把这份 `workerStatus` 一起返回
  - 所以后面如果要做 UI、外部监控或更稳定的宿主验证，不需要再解析日志
- worker 现在也会持续推送结构化实时事件：
  - `GET /stream`
  - 初始会发送：
    - `connected`
    - `processing_status`
  - 后续会继续推送：
    - `processing_status`
    - `new_observation`
    - `new_summary`
  - 项目内已有正式的流读取辅助，不再只靠测试里手写 SSE 解析
- worker 现在也会提供初始快照：
  - `POST /stream/snapshot`
  - 新连接不只看到“连上之后发生了什么”
  - 也能先拿到：
    - 当前 queue 状态
    - 最近 summary
    - 最近 unsummarized observation
- 已新增：
- `memory_context_preview`
  - 可直接预览当前将注入到 system context 的记忆内容
  - 现在也会显示 `[PREVIOUSLY]`，并用 `A:` 标出 assistant 交接文本
  - 不再只能靠隐式 `system transform` 猜“现在会注入什么”
- pending queue 已加入 stale processing 自愈：
  - worker 存活期间，如果某个 job 长时间卡在 `processing`
  - 下一次 claim 同 session 队列时会先把它重置回 `pending`
  - 不再只靠 worker 重启来恢复
- plugin 到 worker 的 HTTP 请求已加入 timeout + abort：
  - 普通 worker 请求超时会主动中止
  - health check 超时会直接视为不健康
- `chat.message` 已加入 run-mode summary flush fallback：
  - 新用户消息进入时，先尝试 flush 上一个 request 的 summary
  - 再写入新的 request anchor
  - 用来补 OpenCode `session.idle` 在一次性 `opencode run` 场景下不稳定的问题
- 纯 memory 回查 prompt 已不再写入 request anchor：
  - `memory_search`
  - `memory_timeline`
  - `memory_details`
  - `memory_context_preview`
  这类“只做回查”的请求不会继续污染 request 历史
- decision 启发式已收紧，不再把普通“生成/输出”措辞直接当成 checkpoint 信号
- internal memory tool 已统一过滤：
  - `memory_search`
  - `memory_timeline`
  - `memory_details`
- 已加入可重复跑的真实宿主 smoke runner：
  - `bun run smoke:host -- --workspace <workspace> --mode control`
  - `bun run smoke:host -- --workspace <workspace> --mode robust`
- 已完成本地 OpenCode 真实宿主 smoke test：
  - plugin 能被宿主加载
  - `memory_search` / `memory_timeline` / `memory_details` / `memory_context_preview` 会进入真实 tool surface
  - `read` observation 会真实落库
  - `memory_timeline` 已能在真实宿主返回时间上下文
  - `memory_context_preview` 已能在真实宿主返回当前注入记忆预览
  - 同一轮控制变量测试里会额外验证：
    - 初始快照链成立
    - worker 跨 run 复用成立
  - 实时流现在也会在真实宿主里验证：
    - 通过 worker 注册表找到正在跑的 worker
    - 先拿一份 `stream/snapshot` 初始快照
    - 连上 `GET /stream`
    - 再触发一次真实 `opencode run`
    - 验证 `new_observation` 会被实时推出来
- 已加入 legacy observation 噪声清洗：
  - 旧 `memory_*` 自查询 observation 会在初始化时清除
  - 旧 raw `read` observation 会在初始化时归一化
- 第一版架构和路线图文档

下一步建议优先实现：

1. 继续细化 phase-aware checkpoint，而不是停在当前启发式 phase
2. 继续增强 ranking，而不是停在当前启发式分数
3. 继续增强 compaction 记忆保留，而不是只影响正常对话
4. 继续收紧 worker 内部编排与 context builder 边界
5. 继续补 stale worker 清理和更明确的关闭策略，而不是只停在“能跨 run 复用”
6. 继续补 worker 级调度与失败恢复，而不是只停在“有子进程”
7. 继续补 pending queue 的失败状态、重试上限与可观测性，而不是只停在“worker 重启后能恢复”
8. 继续补 failed queue 的可见性与手动恢复路径，而不是只停在“内部状态正确”

## 开发与真实测试说明

### OpenCode 本地宿主验证

当前已用本地 OpenCode 宿主完成 smoke test，验证过：

- plugin 能被真实宿主加载
- plugin 能拉起独立 memory worker 进程
- `memory_search`
- `memory_timeline`
- `memory_details`

都会进入真实 tool surface。

当前 smoke 的写入链判定也已对齐这条异步事实：

- 不再要求 plugin 日志里同步出现 `captured observation`
- 不再要求 plugin 日志里同步出现 `captured summary`
- 而是以最终 SQLite 里的：
  - `request_anchors`
  - `observations`
  - `summaries`
  作为真实落盘证据

### Host smoke runner

现在仓库里已经有一个可重复跑的真实宿主回归脚本：

```bash
bun run smoke:host -- \
  --workspace /absolute/path/to/smoke-workspace \
  --mode control
```

可选模式：

- `control`
  - 只验证记忆主闭环
- `robust`
  - 用更松的 prompt 观察宿主下的表现
- `both`
  - 连续跑两种模式

runner 会自动：

1. 在目标 workspace 写入 smoke fixture 文件
2. 写入本地 `.opencode/opencode.json`
3. 生成最小宿主配置
4. 创建隔离 `HOME`
5. 运行真实 `opencode run`
6. 读取 SQLite 并输出两层结果：
   - 机器可读的 `report.json`
   - 人类可读的 `report.md`

当前 `report.md` 会直接告诉你：

- 哪个测试通过、哪个失败
- 写入链是否成立
- 回查链是否成立
- SQLite 里最后有多少 request / observation / summary
- 原始证据文件在哪里

### 开发时要注意的宿主缓存问题

OpenCode 本地插件在开发时存在模块缓存特征：

- 仅重新 `bun run build`，不一定会让当前宿主重新加载新代码
- 若需要做真实宿主验证，最好：
  1. 使用新的本地插件文件名或新的 import query string
  2. 或重启 OpenCode runtime
  3. 或切换到新的临时 workspace

否则会出现：

- 测试和构建都已通过
- 但真实宿主仍在运行旧插件代码

## 可选模型配置

如果你希望 summary 走 model-assisted 路径，而不是只用 deterministic 聚合，需要提供：

- `OPENCODE_MEMORY_SUMMARY_API_URL`
- `OPENCODE_MEMORY_SUMMARY_API_KEY`
- `OPENCODE_MEMORY_SUMMARY_MODEL`

当前实现假设这是一个 OpenAI-compatible `chat/completions` 接口。  
如果未配置或返回异常，插件会自动回退到 deterministic summary，不会中断主链。

## 命名约定

- `SQLite*`
  - 表示这是绑定 SQLite 的具体实现
- `*Repository`
  - 只负责单类对象的持久化读写
- `*Service`
  - 负责跨对象的查询、组装或排序
- `*Pipeline`
  - 负责 runtime 时序编排
- `*Handler`
  - 负责单类 OpenCode hook 的胶水编排
- `memory/contracts.ts`
  - memory 领域的 backend-agnostic 类型与最小接口
  - runtime / tools / injection 依赖这里，不直接依赖 SQLite 目录类型

## 致谢

这个项目的机制设计参考了：

- `opencode-mem`
- `claude-mem`

当前仓库目标是吸收其机制角色，而不是复制其全部代码结构。

## 2026-03-16：当前 context builder header

system context 当前已经会编译出这些 section：

- `Project: ... | Generated: ...`
- `[CONTINUITY]`
- `[CONTEXT INDEX]`
- `[TIMELINE KEY]`
- `[CONTEXT ECONOMICS]`
- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`
- `[PREVIOUSLY]`

其中 `[CONTEXT ECONOMICS]` 当前已经包含两层：

- 真实 coverage：
  - summaries
  - direct observations
  - covered observations
- deterministic token estimate：
  - `Loading` 行现在会直接带出可见记录数
  - `Loading` 的数量单位当前已经对齐成 `observations`
  - `Loading`
  - `Work investment` 会直接写成过去在 `research / building / decisions` 上已经花掉的投入
  - `Your savings` 现在会把百分比写成 `reduction from reuse`

这里的 token 不是 provider 账单，而是基于当前 summary / observation 文本长度做的保守估算。

`Project: ... | Generated: ...` 当前用于告诉模型：

- 这份 memory context 属于哪个项目
- 这是本次 build 时生成的最新工作索引

当前可见的 summary / observation line 也已经带上 record ID：

- summary line 会显示 `#sum_*`
- observation line 会显示 `#obs_*`

这样当前 context 和 `memory_details(ids)` 才真正接得上。

## 2026-03-16：`024-context-value-footer`

- 继续先按 `claude-mem` 对照：
  - 当前仓已经有 `[CONTEXT ECONOMICS]`
  - 但 `claude-mem` footer 还会再给一句“这份 index 为什么值得先信”的收尾话
  - 我们此前还缺这句 value statement
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/024-context-value-footer/spec.md`
  - `specs/024-context-value-footer/plan.md`
  - `specs/024-context-value-footer/tasks.md`
- 本轮实现结果：
  - system context 末尾新增 `[CONTEXT VALUE]`
- 这条 footer 会把当前 `summaries / direct observations / covered observations` 收成一句话
  - 明确表达：先信任当前 index，再决定是否回头重读旧工作
  - 现在还会继续补一条量化句：
    - `Access ~X tokens of past research, building, and decisions for just ~Y tokens of reading.`
- compaction context 继续保持轻量，不带这条 footer

## 2026-03-16：`029-footer-drilldown-reminder`

- 继续先按 `claude-mem` 对照：
  - 我们当前 footer 已经有：
    - `[CONTEXT VALUE]`
    - `Access ~X tokens of past research, building, and decisions for just ~Y tokens of reading.`
  - 但 `claude-mem` 在同一个 footer 位置还会再多一句动作提醒：
    - 这份 index 不够时，应该顺着当前 index 继续下钻
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/029-footer-drilldown-reminder/spec.md`
  - `specs/029-footer-drilldown-reminder/plan.md`
  - `specs/029-footer-drilldown-reminder/tasks.md`
- 本轮实现结果：
  - `[CONTEXT VALUE]` 现在会再多一条短提醒：
    - `If this index is still not enough, use memory_details with visible IDs to access deeper memory before re-reading history.`
  - 这条提醒不替换已有量化句，只做追加
  - compaction context 继续不带这条 footer 提醒

## 2026-03-16：`038-context-drilldown-intro`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[CONTEXT INDEX]` 已经会说：
    - `Trust this index before re-reading code or past history.`
    - `memory_details / memory_timeline / memory_search`
  - 但 `claude-mem` 在同位置还会先加一条过渡句：
    - `When you need implementation details, rationale, or debugging context:`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/038-context-drilldown-intro/spec.md`
  - `specs/038-context-drilldown-intro/plan.md`
  - `specs/038-context-drilldown-intro/tasks.md`
- 本轮实现结果：
  - system context 的 `[CONTEXT INDEX]` 在工具 bullet 前新增这条导语
  - 低预算压缩版继续不带这条额外句子，避免把真正的 timeline 挤掉
  - compaction context 继续不带这条导语

## 2026-03-16：`039-action-led-context-tool-lines`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[CONTEXT INDEX]` 已经有：
    - 一条 drilldown intro
    - 三条拆开的工具 bullet
  - 但 `claude-mem` 的同位置还会把这三条写成“动作在前”：
    - `Fetch by ID: ...`
    - `Search history: ...`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/039-action-led-context-tool-lines/spec.md`
  - `specs/039-action-led-context-tool-lines/plan.md`
  - `specs/039-action-led-context-tool-lines/tasks.md`
- 本轮实现结果：
  - system context 的三条工具说明改成 action-led wording
  - 低预算压缩版继续保持单行压缩
  - compaction context 继续不带这些 wording

## 2026-03-16：`040-project-header-wording`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前头部已经有：
    - 项目名
    - 生成时间
  - 但仍然是标签式：
    - `Project: ... | Generated: ...`
  - `claude-mem` 在同位置是标题式：
    - `# [project] recent context, ...`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/040-project-header-wording/spec.md`
  - `specs/040-project-header-wording/plan.md`
  - `specs/040-project-header-wording/tasks.md`
- 本轮实现结果：
  - system context 的 freshness 行改成标题式 wording
  - 无项目名时也会显示 `# recent context, ...`
  - compaction context 继续不带这行

## 2026-03-16：`041-token-key-detail-lines`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[TOKEN KEY]` 已经有：
    - `Read=current reading cost`
    - `Work=prior work investment`
  - 但 `claude-mem` 的同位置还会把这两项解释成完整句子
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/041-token-key-detail-lines/spec.md`
  - `specs/041-token-key-detail-lines/plan.md`
  - `specs/041-token-key-detail-lines/tasks.md`
- 本轮实现结果：
  - system context 的 `[TOKEN KEY]` 改成两条完整说明
  - compaction context 继续不带这些说明

## 2026-03-16：`030-inline-observation-type-tags`

- 继续先按 `claude-mem` 对照：
  - 我们当前 observation 行已经有：
    - phase
    - file 分组
    - visible ID
  - 但 `claude-mem` 的 observation 行本身还会直接带 type 提示
  - 我们此前只有展开 observation 才会在下一行出现 `Tool: read/write/bash`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/030-inline-observation-type-tags/spec.md`
  - `specs/030-inline-observation-type-tags/plan.md`
  - `specs/030-inline-observation-type-tags/tasks.md`
- 本轮实现结果：
  - system context 的 observation 主行现在会直接显示：
    - `{read}`
    - `{write}`
    - `{bash}`
  - `[TIMELINE KEY]` 现在会一起解释：
    - `{tool}=source tool`
  - `Tool: ...` detail line 继续保留
  - compaction context 继续不引入这条 header 说明

## 2026-03-16：`031-observation-token-hints`

- 继续先按 `claude-mem` 对照：
  - 我们当前 expanded observation 已经有：
    - `Result`
    - `Tool`
    - `Evidence`
  - 但 `claude-mem` 的记录层还会给出 `Read / Work` 这类局部 token 线索
  - 我们此前只有全局 `[CONTEXT ECONOMICS]`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/031-observation-token-hints/spec.md`
  - `specs/031-observation-token-hints/plan.md`
  - `specs/031-observation-token-hints/tasks.md`
- 本轮实现结果：
  - expanded observation detail 现在会显示：
    - `Tokens: Read ~X | Work ~Y`
  - 这条 hint 只进入 system context 的 expanded observation
  - 折叠 observation 主行不新增 token hint
  - compaction context 继续不显示这条 hint

## 2026-03-16：`025-snapshot-investigated`

- 继续先按 `claude-mem` 对照：
  - `claude-mem` 的 latest summary fields 里有 `Investigated`
  - 它表达的是：这一轮实际查了什么
  - 我们此前只有 `Current Focus`，更像“在做什么”，不是“查了什么”
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/025-snapshot-investigated/spec.md`
  - `specs/025-snapshot-investigated/plan.md`
  - `specs/025-snapshot-investigated/tasks.md`
- 本轮实现结果：
  - latest snapshot 在存在稳定 evidence 时新增 `Investigated`
  - 当前优先从 latest summary 覆盖 observation 的文件 / 命令 trace 中提取
  - system context 与 compaction snapshot 保持一致

## 2026-03-16：`026-stale-snapshot-gating`

- 继续先按 `claude-mem` 对照：
  - `claude-mem` 不会在 summary 比 direct observation 更旧时继续显示 latest summary
  - 我们此前还没有这条 freshness gating
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/026-stale-snapshot-gating/spec.md`
  - `specs/026-stale-snapshot-gating/plan.md`
  - `specs/026-stale-snapshot-gating/tasks.md`
- 本轮实现结果：
  - 当 direct observation 更新于 latest summary 时，不再渲染 `[LATEST SESSION SNAPSHOT]`
  - stale summary 会回到 timeline，而不是消失
  - system context 与 compaction context 复用同样的 freshness 规则

## 2026-03-16：`042-timeline-key-detail-lines`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[TIMELINE KEY]` 已经能解释：
    - `[summary]`
    - phase label
    - `{tool}`
    - `[day]`
    - `[file]`
  - 但仍然是单行压缩写法
  - `claude-mem` 的同位置更接近多条 legend，扫读性更好
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/042-timeline-key-detail-lines/spec.md`
  - `specs/042-timeline-key-detail-lines/plan.md`
  - `specs/042-timeline-key-detail-lines/tasks.md`
- 本轮实现结果：
  - system context 的 `[TIMELINE KEY]` 现在改成多条完整说明
  - 分别解释：
    - `[summary]`
    - phase label
    - `{tool}`
    - `[day]`
    - `[file]`
  - compaction context 继续不带这组 legend

## 2026-03-16：`043-semantic-context-index-wording`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[CONTEXT INDEX]` 已经有：
    - recent working index
    - coverage line
    - trust / drilldown guidance
  - 但 `claude-mem` 的同位置还会直接把这段叫成 `semantic index`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/043-semantic-context-index-wording/spec.md`
  - `specs/043-semantic-context-index-wording/plan.md`
  - `specs/043-semantic-context-index-wording/tasks.md`
- 本轮实现结果：
  - system context 的 `[CONTEXT INDEX]` 第一行现在变成：
    - `This semantic index is a recent working index.`
  - 其余 coverage / trust / drilldown bullet 保持不变
  - compaction context 继续不带这句 wording

## 2026-03-16：`044-context-index-trust-wording`

- 继续先按 `claude-mem` 对照：
  - 当前仓此前 `[CONTEXT INDEX]` 已经有 trust line
  - 但仍然是一般性的：
    - `Trust this index before re-reading code or past history.`
  - `claude-mem` 的同位置还会更具体写到：
    - `past decisions and learnings`
- 本轮严格按 `spec-kit` 工件推进：
  - `specs/044-context-index-trust-wording/spec.md`
  - `specs/044-context-index-trust-wording/plan.md`
  - `specs/044-context-index-trust-wording/tasks.md`
- 本轮实现结果：
  - system context 的 trust line 现在变成：
    - `Trust this index over re-reading code for past decisions and learnings.`
  - 其余 context index bullet 保持不变
  - compaction context 继续不带这句 wording
