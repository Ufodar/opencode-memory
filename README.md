# opencode-memory

`opencode-memory` is a persistent working-memory plugin for OpenCode.

It organizes your working process into `observation`, `summary`, and re-injectable `context`, so the agent can pick up where it left off in the next conversation turn.

## Quick Start

OpenCode currently loads plugins in a configuration-driven way. The shortest setup path is:

1. Enable the plugin package name in `~/.config/opencode/opencode.json`
2. Configure the plugin parameters in `~/.config/opencode/opencode-memory.jsonc`
3. Restart OpenCode

### 1. Install the plugin

After release, we recommend installing directly by package name:

```jsonc
{
  "plugin": ["@ufodar/opencode-memory"]
}
```

After restarting OpenCode, the plugin will be downloaded and loaded automatically.

If you want to pin a specific version, you can also write:

```jsonc
{
  "plugin": ["@ufodar/opencode-memory@0.1.2"]
}
```

### 2. Configure the plugin

We recommend keeping the `opencode-memory` parameters in a dedicated file:

`~/.config/opencode/opencode-memory.jsonc`

If you just want to get semantic retrieval running first, a minimal example looks like this:

```jsonc
{
  "embeddingApiUrl": "https://your-openai-compatible-api/v1",
  "embeddingApiKey": "env://OPENAI_API_KEY",
  "embeddingModel": "Qwen3-embedding",
  "embeddingDimensions": 2560,
  "vectorBackend": "usearch"
}
```

`embeddingDimensions` must match the actual vector length returned by your embedding endpoint. Different models or gateways may differ, so don't guess based only on the model name.

If you also want the plugin to use a model to generate better summary / observation content, you can add:

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

### 3. Optional configuration

- `storagePath`
  - Default: `~/.opencode-memory/data`
- `outputLanguage`
  - `en` or `zh`
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

Secrets support these three syntaxes:

- A plain string
- `env://ENV_VAR_NAME`
- `file:///absolute/path/to/secret.txt`

Environment variables remain available and take priority over `opencode-memory.jsonc`.

## Local source development

If you're developing in a local checkout, build first:

```bash
bun install
bun run build
```

Then load the local build directly in `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugin": [
    "file:///absolute/path/to/opencode-memory/dist/index.js"
  ]
}
```

## What it does

- Automatically captures observations after tool execution
- Aggregates summaries per request window
- Persists memory through a dedicated worker
- Re-injects context on the next turn and during compaction
- Provides:
  - `memory_search`
  - `memory_timeline`
  - `memory_details`

## Exposed tools

- `memory_search`
  - Looks up summary / observation
  - Supports `scope`, `kind`, `phase`
- `memory_timeline`
  - Expands a timeline around a summary or observation anchor
- `memory_details`
  - Views individual record details and structured evidence
- `memory_context_preview`
  - Previews the memory context that will be injected into the current session
- `memory_queue_status`
  - Views worker queue status
- `memory_queue_retry`
  - Retries failed queue items

## Architecture overview

```text
OpenCode hooks / tools
  -> plugin handlers
  -> memory worker client
  -> external Bun worker
  -> SQLite + vector index
  -> context builder / retrieval services
```

Core responsibilities are split into four layers:

- capture
  - Writes request anchors and observations into the worker queue
- summary
  - Aggregates checkpoint summaries from observations
- retrieval
  - `search -> timeline -> details`
- injection
  - Compiles recent memory into system / compaction context

## Development

```bash
bun test
bun run typecheck
bun run build
```

Optional host regression:

```bash
bun run smoke:host -- --workspace /absolute/path/to/workspace --mode control
```

## Acknowledgments

`opencode-memory` referenced the following projects during its early exploration:

- [`tickernelz/opencode-mem`](https://github.com/tickernelz/opencode-mem)
- [`thedotmack/claude-mem`](https://github.com/thedotmack/claude-mem)

The current project has been heavily refactored around a dedicated worker, summary-first retrieval, a structured context builder, and the OpenCode plugin configuration approach, but keeping this source attribution is more accurate and better suited for open collaboration.

## License

[MIT](LICENSE)
