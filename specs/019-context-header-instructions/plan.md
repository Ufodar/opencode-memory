# Implementation Plan: Context Header Instructions

**Branch**: `[019-context-header-instructions]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/019-context-header-instructions/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/019-context-header-instructions/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/019-context-header-instructions/spec.md`

## Summary

补上和 `claude-mem` 当前仍然存在的一条真实差距：在 context header 中，不只是告诉模型“有哪些 memory tools 可以继续用”，还要明确告诉模型“这份 memory index 通常已经足够继续工作，只有缺证据、缺实现细节、缺过去决策理由时，才需要继续下钻”。实现方式保持最小化：不增加 token economics、不改 retrieval 行为、不改数据库 schema，只在 system context 开头增加 `[CONTEXT INDEX]` section，并保持 compaction context 不受影响。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: 只增加极短 header 说明，不显著增加 context 构建成本  
**Constraints**: 不新增 schema；不引入 token economics 数值；不改变 compaction output 的结构  
**Scale/Scope**: 仅覆盖 system context header 的说明层

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `019` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补 header 的 context index 说明差距，满足。
- 保持最小主线：不碰 worker runtime、embedding、retrieval 排序与 schema，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/019-context-header-instructions/
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

**Structure Decision**: 保持当前 `worker -> context builder` 结构，只调整 system context header 的说明文本，不引入新的存储、runtime 抽象或配置项。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增配置文件
- 不改变 retrieval 和 summary 编排
