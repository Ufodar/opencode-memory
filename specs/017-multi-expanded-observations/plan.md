# Implementation Plan: Multi Expanded Observations

**Branch**: `[017-multi-expanded-observations]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/017-multi-expanded-observations/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/017-multi-expanded-observations/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/017-multi-expanded-observations/spec.md`

## Summary

补上和 `claude-mem` 当前仍然存在的一条真实差距：memory timeline 不再固定只展开最新 1 条 observation，而是允许最近几条关键 observation 都展开 detail lines。实现方式保持最小化：不改 detail line 内容，不改 SQLite schema，只把 context builder 中的 expanded observation window 从单条推进到最近两条，并复用到 system context 与 compaction context。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: 只把 expanded observation window 从 1 调整到少量多条，不显著增加 context 构建成本  
**Constraints**: 不新增 schema；不改变 detail line 的字段来源；不让 timeline 重新膨胀成长日志  
**Scale/Scope**: 仅覆盖 context builder 中“展开几条 observation”的策略，system / compaction 共用

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `017` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补“展开最近几条 observation”差距，满足。
- 保持最小主线：不碰 worker runtime、embedding、retrieval 排序与 schema，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/017-multi-expanded-observations/
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

**Structure Decision**: 保持当前 `worker -> context builder` 结构，只调整 expanded observation window 的选择逻辑，不引入新的存储或 runtime 抽象。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增配置文件
- 不改变 detail line 的类型
