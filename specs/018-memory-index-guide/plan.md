# Implementation Plan: Memory Index Guide

**Branch**: `[018-memory-index-guide]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/018-memory-index-guide/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/018-memory-index-guide/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/018-memory-index-guide/spec.md`

## Summary

补上和 `claude-mem` 当前仍然存在的一条真实差距：system context 开头不再只是进入 memory sections，而是先给一小段 memory index guide，告诉模型当前 memory snapshot 的用途，以及何时使用 `memory_details / memory_timeline / memory_search` 继续下钻。实现方式保持最小化：只改 system context，不碰 compaction context，不新增 tool 或 schema。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: guide 保持短小，不显著增加 context 长度  
**Constraints**: 只改 system context，不改 compaction context；不新增 tool / schema / model call  
**Scale/Scope**: 仅覆盖 context builder 的 system 侧前导说明

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `018` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补“memory index guide”差距，满足。
- 保持最小主线：不碰 worker runtime、timeline 编排、embedding 与 schema，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/018-memory-index-guide/
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
        ├── compiled-context.ts
        ├── system-context.ts
        └── curated-context-text.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 保持当前 context builder 结构，只在 system context 头部增加一小段 guide 文本；compaction context 维持当前形态。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增工具
- 不改变 compaction 行为
