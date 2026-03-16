# Implementation Plan: Inline Observation Token Hints

**Branch**: `[033-inline-observation-token-hints]` | **Date**: 2026-03-16 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/033-inline-observation-token-hints/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/033-inline-observation-token-hints/spec.md`

## Summary

对照 `claude-mem` 的 observation 行输出，为 system context 的 observation 主行增加简短 `Read ~X | Work ~Y`；保持 expanded detail 的 `Tokens:` 行不变，并继续让 compaction context 保持轻量。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 context 文本渲染）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只在 system context observation 行增加短字符串，不新增查询  
**Constraints**: 不改 schema、不改 worker runtime、不改 compaction 结构  
**Scale/Scope**: 单一 observation 行 token hint 对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/033-inline-observation-token-hints/
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
        └── curated-context-text.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 只改 system context observation 主行的字符串拼接；compaction 继续保持现状。
