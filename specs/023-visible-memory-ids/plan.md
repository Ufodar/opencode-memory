# Implementation Plan: Visible Memory IDs

**Branch**: `[023-visible-memory-ids]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/023-visible-memory-ids/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/023-visible-memory-ids/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/023-visible-memory-ids/spec.md`

## Summary

补上和 `claude-mem` 当前仍存在的一条 retrieval 可用性差距：system context 不只列出 summary / observation 内容，还要把这些 record 的 ID 暴露出来，这样 `memory_details(ids)` 才真正能顺着当前 context 下钻。实现方式保持最小：只让 system context 的 summary / observation line 显示 ID，不改 tool surface、schema 或 retrieval 结果。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: 只增加最小 ID 显示，不显著增加 context 构建成本  
**Constraints**: 不新增 schema；不改 tool surface；不改变 compaction 主结构；不改变 retrieval 行为  
**Scale/Scope**: 仅覆盖 system context 的 summary / observation line 显示 ID

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `023` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补可见 record ID 差距，满足。
- 保持最小主线：不碰 worker runtime、embedding、schema 与 retrieval 排序，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/023-visible-memory-ids/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── runtime/
    └── injection/
        ├── curated-context-text.ts
        ├── compiled-context.ts
        └── compaction-context.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 保持当前 `worker -> context builder` 结构，只让 system context 的 summary / observation line 暴露 record ID，不新增新的 retrieval 或 runtime 抽象。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增配置文件
- 不改变 timeline 排序和 retrieval 输出结构
