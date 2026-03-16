# Implementation Plan: Expanded Key Observations

**Branch**: `[016-expanded-key-observations]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/016-expanded-key-observations/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/016-expanded-key-observations/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/016-expanded-key-observations/spec.md`

## Summary

补上和 `claude-mem` 当前仍然存在的一条真实输出差距：在 memory timeline 中，不再把所有 observation 永远压成一行，而是对少量关键 observation 展开多行细节。实现方式保持最小化：不改 SQLite schema，不改 retrieval 排序，只在 context builder 中挑出最新关键 observation，并从现有 observation 结构化字段里编出附加 detail lines，同时复用到 system context 与 compaction context。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: timeline 展开只针对极少量 observation，不显著增加 context 构建成本  
**Constraints**: 不新增 schema；不改变 summary 生成；不让 timeline 重新膨胀成长日志  
**Scale/Scope**: 仅覆盖 context builder 中的 observation 展示策略，system / compaction 共用

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `016` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补“关键 observation 展开”差距，满足。
- 保持最小主线：不碰 worker runtime、embedding、retrieval 排序与 schema，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/016-expanded-key-observations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── runtime/
│   └── injection/
│       ├── compiled-context.ts
│       ├── compaction-context.ts
│       ├── curated-context-text.ts
│       └── evidence-hints.ts
└── memory/
    └── observation/
        └── types.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 继续保持当前 `worker -> context builder` 结构。关键 observation 的选择和展开逻辑集中放在 injection/context builder 层，避免把“展示策略”下沉到存储层或 worker 协议。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增 retrieval API
- 不新增模型调用
