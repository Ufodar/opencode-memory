# Implementation Plan: Day Grouped Memory Timeline

**Branch**: `[012-day-grouped-memory-timeline]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/012-day-grouped-memory-timeline/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/012-day-grouped-memory-timeline/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/012-day-grouped-memory-timeline/spec.md`

## Summary

这轮只补一个 `claude-mem` 主线差距：让跨天的 timeline checkpoint 带日期分组行，而不是只有连续的 `HH:MM`。实现上不新增 schema，不引入模型调用，只在已经按时间混排好的 timeline 编译阶段检测日期切换并插入 `[day] YYYY-MM-DD` 分组行。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript / Bun  
**Primary Dependencies**: OpenCode plugin runtime, Bun test, TypeScript compiler  
**Storage**: SQLite 现有字段复用，无 schema 变更  
**Testing**: `bun test`（仅跑本 feature 相关测试）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode 本地插件运行时  
**Project Type**: library / plugin  
**Performance Goals**: 跨天 timeline 更容易恢复工作日期边界，不破坏现有 budget 与主闭环  
**Constraints**: deterministic、短文本、兼容 `011` 的时间混排与时间前缀、不引入新模型调用  
**Scale/Scope**: 仅触及 context builder 的 timeline 分组组织

## Constitution Check

本轮满足当前项目约束：

- 先做 `claude-mem` 对照，再确定 spec 仍在主线
- 不新增业务逻辑
- 不引入重型依赖
- 不把无关的 worker 启动老问题混进当前数据线
- 保持 deterministic，可用最小测试单独验证

## Project Structure

### Documentation (this feature)

```text
specs/012-day-grouped-memory-timeline/
├── plan.md              # This file (/speckit.plan command output)
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
└── runtime/
    └── injection/
        ├── compiled-context.ts
        └── compaction-context.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 这轮只改 timeline 分组显示，不触碰 worker、存储和 retrieval service。

## Complexity Tracking

本轮无需额外复杂度豁免。
