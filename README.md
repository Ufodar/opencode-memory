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
- observation 主文本已优先保留工具结果语义，而不是只写成 `tool: title`
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
  - `memory_search` / `memory_timeline` / `memory_details` 会进入真实 tool surface
  - `read` observation 会真实落库
  - `memory_timeline` 已能在真实宿主返回时间上下文
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
