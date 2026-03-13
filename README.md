# opencode-continuity

OpenCode 的通用 memory continuity 插件底座。

## 定位

这个项目是一个独立的 MIT 开源仓库，方向是：

- 面向 OpenCode
- 专注 memory continuity
- 逼近 `claude-mem` 的核心机制角色
- 不直接夹带业务领域逻辑

第一阶段只做通用能力：

- observation 级采集
- summary 聚合
- system/background 注入
- 分层检索
- compaction continuity

第一阶段不做：

- 标书或其他业务特化 memory
- 团队知识库
- 重型外部 worker
- 复杂 timeline / reranking

## 设计原则

1. 角色等价，不做平台照搬
2. 先 observation，再 summary
3. 先通用 continuity substrate，再叠业务层
4. 保持 MIT 独立仓，避免混入 AGPL 代码

## 仓库结构

```text
src/
  index.ts
  config/
  runtime/
    hooks/
    injection/
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
- `memory_search` / `memory_timeline` 在未显式指定 `scope` 时已默认：
  - 先查当前 session
  - 再回退 project
- `memory_search` 已过滤被返回 summary 覆盖的 observation
- `memory_search` 已具备第一版 deterministic ranking
- summary 已支持可选 model-assisted 生成，并保留 deterministic fallback
- model-assisted summary 已加入输出归一化、长度约束与弱 nextStep 过滤
- model-assisted summary 已加入 timeout，provider 卡住时会自动回退
- system injection 已升级为 summary-first，并自动过滤已被 summary 覆盖的 observation
- compaction 已支持 continuity context 注入：
  - 优先注入 recent summaries
  - 再补 recent unsummarized observations
  - 帮助 OpenCode compaction 保留 continuity checkpoint
- retrieval 已支持 `session / project` scope
- retrieval tools 已开始内建 `session-first / project-fallback` 默认行为，减少 agent 端判断负担
- system injection 已支持 session-first / project-fallback 选择
- system injection 已支持 count + character budget
- observation 主文本已优先保留工具结果语义，而不是只写成 `tool: title`
- `session.idle` summary 主链已加入 session 级重入保护
- decision 启发式已收紧，不再把普通“生成/输出”措辞直接当成 checkpoint 信号
- internal continuity tool 已统一过滤：
  - `memory_search`
  - `memory_timeline`
  - `memory_details`
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
3. 继续增强 compaction continuity，而不是只影响正常对话
4. 再评估是否需要轻量外部 worker
5. 如进入 worker 化，优先保持当前 deterministic 主链不变，只迁移 runtime 边界

## 开发与真实测试说明

### OpenCode 本地宿主验证

当前已用本地 OpenCode 宿主完成 smoke test，验证过：

- plugin 能被真实宿主加载
- `memory_search`
- `memory_timeline`
- `memory_details`

都会进入真实 tool surface。

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

- `OPENCODE_CONTINUITY_SUMMARY_API_URL`
- `OPENCODE_CONTINUITY_SUMMARY_API_KEY`
- `OPENCODE_CONTINUITY_SUMMARY_MODEL`

当前实现假设这是一个 OpenAI-compatible `chat/completions` 接口。  
如果未配置或返回异常，插件会自动回退到 deterministic summary，不会中断主链。

## 致谢

这个项目的机制设计参考了：

- `opencode-mem`
- `claude-mem`

当前仓库目标是吸收其机制角色，而不是复制其全部代码结构。
