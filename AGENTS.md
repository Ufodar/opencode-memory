# opencode-memory Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies
- SQLite (`memory.sqlite`) (004-curated-memory-context)
- TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 worker HTTP/runtime (015-previously-handoff-context)
- 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库 (015-previously-handoff-context)
- TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块 (016-expanded-key-observations)
- TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块 (027-context-work-economics)
- N/A（复用已有 summary / observation 字段，不新增持久化） (027-context-work-economics)
- N/A（复用已有 economics estimate，不新增持久化） (028-quantified-context-value)
- N/A（复用已有 visible ID 与 footer 文本，不新增持久化） (029-footer-drilldown-reminder)
- N/A（复用已有 observation.tool 信息，不新增持久化） (030-inline-observation-type-tags)
- N/A（复用 observation 文本字段做 deterministic estimate，不新增持久化） (031-observation-token-hints)
- N/A（只新增 header 说明，不新增持久化） (032-token-hint-key)

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
- 032-token-hint-key: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块
- 031-observation-token-hints: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块
- 030-inline-observation-type-tags: Added TypeScript + Bun + `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
