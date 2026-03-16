# opencode-memory Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies
- SQLite (`memory.sqlite`) (004-curated-memory-context)
- TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 worker HTTP/runtime (015-previously-handoff-context)
- 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库 (015-previously-handoff-context)
- TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块 (016-expanded-key-observations)

- TypeScript + Bun + Bun runtime、OpenCode plugin API、SQLite、本地独立 worker (003-semantic-memory-records)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript + Bun: Follow standard conventions

## Recent Changes
- 023-visible-memory-ids: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块
- 022-project-freshness-header: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块
- 021-context-economics: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
