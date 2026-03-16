# Implementation Plan: Context Index Trust Wording

**Branch**: `[044-context-index-trust-wording]` | **Date**: 2026-03-16 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/044-context-index-trust-wording/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/044-context-index-trust-wording/spec.md`

## Summary

对照 `claude-mem` 的 trust line，把 system context 中 `[CONTEXT INDEX]` 下的 trust guidance 从一般性的“先信 index 再读历史”，推进成更具体的“优先信 index 处理 past decisions and learnings” wording；compaction context 继续保持不变。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 header 文本渲染）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只改 trust line，不新增查询  
**Constraints**: 不改 `[CONTEXT INDEX]` 首句、不改 drilldown bullets、不改 `[TIMELINE KEY]`、不改 footer、不改 schema、不改 worker runtime  
**Scale/Scope**: 单一 trust guidance wording 对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/044-context-index-trust-wording/
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
        └── curated-context-text.ts

tests/
└── runtime/
    ├── system-context.test.ts
    └── compaction-context.test.ts
```

**Structure Decision**: 只改 `[CONTEXT INDEX]` 下的 trust line；compaction 只做回归确认。

## Complexity Tracking

本轮无额外复杂度豁免。
