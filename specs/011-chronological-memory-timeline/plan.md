# Implementation Plan: Chronological Memory Timeline

**Branch**: `[011-chronological-memory-timeline]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/011-chronological-memory-timeline/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/011-chronological-memory-timeline/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/011-chronological-memory-timeline/spec.md`

## Summary

这轮只补一个 `claude-mem` 主线差距：让 `[MEMORY TIMELINE]` 真正按时间混排 summary 与 observation，而不是先输出全部 summary，再输出全部 observation。实现上不新增 schema，不引入模型调用，只在 context builder 编译阶段构建统一 checkpoint 列表并按 `createdAt` 升序排序。

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
**Performance Goals**: timeline 排序更接近真实工作顺序，不破坏现有 budget 与主闭环  
**Constraints**: deterministic、短文本、兼容 `010` 时间前缀规则、不引入新模型调用  
**Scale/Scope**: 仅触及 context builder 的 timeline 排序组织

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
specs/011-chronological-memory-timeline/
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

**Structure Decision**: 这轮只改 timeline 编译顺序，不触碰 worker、存储和 retrieval service。

## Complexity Tracking

本轮无需额外复杂度豁免。
