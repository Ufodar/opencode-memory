# Implementation Plan: Token Hint Key

**Branch**: `[032-token-hint-key]` | **Date**: 2026-03-16 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/032-token-hint-key/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/032-token-hint-key/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

对照 `claude-mem` 的 column key 后，为 system context header 增加一条很短的 `[TOKEN KEY]`，解释 `Read` / `Work` 的含义；这轮不改变 observation 行或 token hint 的格式。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只新增 header 说明，不新增持久化）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime
**Project Type**: library/plugin  
**Performance Goals**: 只增加一条短 header 文本，不增加查询次数  
**Constraints**: 不改 schema、不改 worker runtime、不改 compaction 结构  
**Scale/Scope**: 单一 token key 说明增强

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/032-token-hint-key/
├── plan.md
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
        └── curated-context-text.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 只改 system context header 中的一条 token key，不动 store/runtime/schema；compaction test 只做回归确认。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
