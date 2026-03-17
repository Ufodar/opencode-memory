# opencode-memory

`opencode-memory` 是一个面向 OpenCode 的持久工作记忆插件。

它把工作过程拆成 `observation`、`summary` 和可回注的 `context`，通过独立 worker 在会话外持久化这些数据，并在下一轮对话、compaction 和检索工具中重新使用它们。

## 为什么做这个项目

长任务里最容易丢的是这些信息：

- 刚刚读过哪些文件
- 上一轮做出了什么判断
- 为什么停在这里
- 下一步最合理的恢复点是什么

`opencode-memory` 的目标不是做任务编排器，而是给 OpenCode 提供一层稳定的工作记忆底座。

## 当前能力

- 工具执行后自动采集 observation
- 按 request window 聚合 summary
- 独立 Bun worker 处理 capture、summary、retrieval 和 context build
- worker 可跨多次 `opencode run` 复用
- system context 注入与 compaction context 注入
- `memory_search` / `memory_timeline` / `memory_details`
- `summary-first` 检索纪律
- `session-first / project-fallback` 检索范围
- 第一版 semantic retrieval
  - OpenAI-compatible embeddings API
  - `usearch` / `exact-scan` 向量后端
- 中英基础 language-neutral heuristics

## 安装

先构建：

```bash
bun install
bun run build
```

然后在 OpenCode 配置里加载打包后的插件入口，例如：

```json
{
  "plugins": [
    "file:///absolute/path/to/opencode-memory/dist/index.js"
  ]
}
```

## 配置

### 必需环境

- `OPENCODE_MEMORY_DATA_DIR`
  - memory 数据目录；不设置时使用默认本地目录

### 可选模型配置

用于 summary / observation 模型增强：

- `OPENCODE_MEMORY_SUMMARY_API_URL`
- `OPENCODE_MEMORY_SUMMARY_API_KEY`
- `OPENCODE_MEMORY_SUMMARY_MODEL`
- `OPENCODE_MEMORY_OBSERVATION_API_URL`
- `OPENCODE_MEMORY_OBSERVATION_API_KEY`
- `OPENCODE_MEMORY_OBSERVATION_MODEL`
- `OPENCODE_MEMORY_OUTPUT_LANGUAGE`
  - 默认英文；设置为 `zh` 时输出中文

### 可选向量检索配置

- `OPENCODE_MEMORY_EMBEDDING_API_URL`
- `OPENCODE_MEMORY_EMBEDDING_API_KEY`
- `OPENCODE_MEMORY_EMBEDDING_MODEL`
- `OPENCODE_MEMORY_EMBEDDING_DIMENSIONS`
- `OPENCODE_MEMORY_VECTOR_BACKEND`
  - `usearch`
  - `exact-scan`

## 暴露的工具

- `memory_search`
  - 查找 summary / observation
  - 支持 `scope`、`kind`、`phase`
- `memory_timeline`
  - 围绕 summary 或 observation anchor 展开时间线
- `memory_details`
  - 查看单条记录详情和结构化证据
- `memory_context_preview`
  - 预览当前会话将被注入的 memory context
- `memory_queue_status`
  - 查看 worker 队列状态
- `memory_queue_retry`
  - 重试失败队列项

## 检索模型

当前检索分成两层：

- `SQLite`
  - 真源
  - 元数据过滤
  - 结果 hydration
- `vector index`
  - semantic retrieval
  - 当前后端：
    - `USearchVectorIndex`
    - `ExactScanVectorIndex`

`memory_search` 当前会在同一 scope 内合并 semantic 与 text 命中，然后继续遵守 `summary-first`。

## 架构概览

```text
OpenCode hooks / tools
  -> plugin handlers
  -> memory worker client
  -> external Bun worker
  -> SQLite + vector index
  -> context builder / retrieval services
```

核心职责分成四层：

- capture
  - 把 request anchor 和 observation 写入 worker 队列
- summary
  - 从 observation 聚合 checkpoint summary
- retrieval
  - `search -> timeline -> details`
- injection
  - 把 recent memory 编译成 system / compaction context

更多细节见：

- [架构说明](docs/architecture.md)

## 开发

```bash
bun test
bun run typecheck
bun run build
```

可选宿主回归：

```bash
bun run smoke:host -- --workspace /absolute/path/to/workspace --mode control
```

### 本地 spec-driven 工作流

仓库本地使用 `spec-kit` 维护 `spec / plan / tasks` 流程，但这些工件默认只在本地保留，不进入 Git 历史。

## 项目状态

当前更接近：

- `alpha`
- development-ready

已经可以真实试用和持续公开开发，但还不应宣称为稳定发布版。

## 许可证

[MIT](LICENSE)
