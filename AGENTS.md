# opencode-memory Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-17

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
- N/A（只调整 context 文本渲染） (033-inline-observation-token-hints)
- N/A（只调整 header 文本渲染） (035-context-index-trust-guidance)
- N/A（只调整 header 文本顺序） (049-reorder-context-index-trust-line)
- N/A（只调整 `PREVIOUSLY` 文本格式） (050-previously-assistant-handoff-label)
- N/A（只调整 token key 文本） (051-token-key-work-clarifier)
- N/A（只调整 footer phrasing） (053-context-value-access-phrasing)
- N/A（只调整 footer 最后一行 phrasing） (054-footer-visible-id-access)
- N/A（只调整 snapshot label） (055-next-steps-snapshot-label)
- N/A（只调整 snapshot 字段集合） (056-drop-current-focus-snapshot-field)
- N/A（只调整 economics 文本） (057-loading-line-record-count)
- TypeScript + Bun + Bun test, OpenCode runtime integration (060-loading-observations-wording)
- TypeScript + Bun + `@opencode-ai/plugin`、`bun:sqlite`、`usearch` (061-vector-memory-search)
- SQLite + 本地 vector index 文件 / in-memory cache (061-vector-memory-search)
- TypeScript / Bun + `@opencode-ai/plugin`, `bun:sqlite`, `usearch` (065-hybrid-memory-search-results)
- SQLite + 本地向量索引 (065-hybrid-memory-search-results)

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
- 065-hybrid-memory-search-results: Added TypeScript / Bun + `@opencode-ai/plugin`, `bun:sqlite`, `usearch`
- 062-semantic-memory-timeline: Added TypeScript + Bun + `@opencode-ai/plugin`、`bun:sqlite`、`usearch`
- 061-vector-memory-search: Added TypeScript + Bun + `@opencode-ai/plugin`、`bun:sqlite`、`usearch`


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
