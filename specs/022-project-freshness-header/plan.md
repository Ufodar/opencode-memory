# Implementation Plan: Project Freshness Header

**Branch**: `[022-project-freshness-header]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/022-project-freshness-header/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/022-project-freshness-header/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/022-project-freshness-header/spec.md`

## Summary

补上和 `claude-mem` 当前仍存在的一条 header 差距：system context 不只告诉模型“这是 memory index”，还要告诉模型“这是哪个项目、什么时候生成的”。这轮采用最小实现：在 system context 头部增加 project freshness header，项目名从 injected records 的 `projectPath` basename 派生，生成时间使用当前本地时间，并保持 compaction context 不受影响。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 memory worker / runtime injection 模块  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: 只增加极短 header 说明，不显著增加 context 构建成本  
**Constraints**: 不新增 schema；不改变 compaction output；不改变 retrieval 行为；不改变 worker runtime  
**Scale/Scope**: 仅覆盖 system context header 的 project/freshness 信息

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `022` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补 header 的 project/freshness 差距，满足。
- 保持最小主线：不碰 worker runtime、embedding、schema 与 retrieval 排序，满足。
- 测试先行：先写 system / compaction 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/022-project-freshness-header/
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

**Structure Decision**: 保持当前 `worker -> context builder` 结构，只调整 system context header 的 project/freshness 文本，不引入新的存储、runtime 抽象或配置项。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增数据库字段
- 不新增配置文件
- 不改变 timeline 和 retrieval 输出结构
