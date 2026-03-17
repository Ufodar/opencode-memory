# opencode-memory

`opencode-memory` 是一个面向 OpenCode 的持久工作记忆插件。

它会把工作过程整理成 `observation`、`summary` 和可回注的 `context`，让 agent 在下一轮对话里继续接上之前的工作。

## Quick Start

OpenCode 目前是配置驱动的插件加载方式。最短安装路径就是：

1. 在 `~/.config/opencode/opencode.json` 里启用插件包名
2. 在 `~/.config/opencode/opencode-memory.jsonc` 里配置插件参数
3. 重启 OpenCode

### 1. 安装插件

发布后，推荐直接按包名安装：

```jsonc
{
  "plugin": ["@ufodar/opencode-memory"]
}
```

重启 OpenCode 后，插件会自动下载并加载。

如果你想固定版本，也可以写成：

```jsonc
{
  "plugin": ["@ufodar/opencode-memory@0.1.1"]
}
```

### 2. 配置插件

推荐把 `opencode-memory` 的参数单独放在：

`~/.config/opencode/opencode-memory.jsonc`

如果你只想先把语义检索跑起来，最小示例可以直接这样写：

```jsonc
{
  "embeddingApiUrl": "https://your-openai-compatible-api/v1",
  "embeddingApiKey": "env://OPENAI_API_KEY",
  "embeddingModel": "Qwen3-embedding",
  "embeddingDimensions": 4096,
  "vectorBackend": "usearch"
}
```

如果你还想让插件用模型帮你生成更好的 summary / observation，可以继续加：

```jsonc
{
  "summaryApiUrl": "https://your-openai-compatible-api/v1",
  "summaryApiKey": "env://OPENAI_API_KEY",
  "summaryModel": "gpt-4o-mini",
  "observationApiUrl": "https://your-openai-compatible-api/v1",
  "observationApiKey": "env://OPENAI_API_KEY",
  "observationModel": "gpt-4o-mini"
}
```

### 3. 可选配置

- `storagePath`
  - 默认是 `~/.opencode-memory/data`
- `outputLanguage`
  - `en` 或 `zh`
- `embeddingApiUrl`
- `embeddingApiKey`
- `embeddingModel`
- `embeddingDimensions`
- `vectorBackend`
  - `usearch`
  - `exact-scan`
- `summaryApiUrl`
- `summaryApiKey`
- `summaryModel`
- `observationApiUrl`
- `observationApiKey`
- `observationModel`

密钥支持这三种写法：

- 直接写字符串
- `env://ENV_VAR_NAME`
- `file:///absolute/path/to/secret.txt`

环境变量仍然可用，并且优先级高于 `opencode-memory.jsonc`。

## 本地源码开发

如果你是在本地仓库里开发，先构建：

```bash
bun install
bun run build
```

然后在 `~/.config/opencode/opencode.json` 里直接加载本地构建产物：

```jsonc
{
  "plugin": [
    "file:///absolute/path/to/opencode-memory/dist/index.js"
  ]
}
```

## 它会做什么

- 工具执行后自动采集 observation
- 按 request window 聚合 summary
- 通过独立 worker 持久化 memory
- 在下一轮对话和 compaction 时回注 context
- 提供：
  - `memory_search`
  - `memory_timeline`
  - `memory_details`

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

## Acknowledgments

`opencode-memory` 在早期探索阶段参考了：

- [`tickernelz/opencode-mem`](https://github.com/tickernelz/opencode-mem)
- [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem)

当前项目已经围绕独立 worker、summary-first retrieval、structured context builder 和 OpenCode 插件配置方式做了大量重构，但保留这层来源说明更准确，也更适合公开协作。

## 许可证

[MIT](LICENSE)
