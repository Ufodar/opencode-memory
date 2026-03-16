# Implementation Plan: Token Key Read Clarifier

**Branch**: `[052-token-key-read-clarifier]` | **Date**: 2026-03-17 | **Spec**: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/052-token-key-read-clarifier/spec.md`
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/052-token-key-read-clarifier/spec.md`

## Summary

对照 `claude-mem` 的 token key 段，把 system context 里的 `Read` line 从泛化说明补成带 `cost to learn it now` clarifier；compaction context 继续不受影响。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 runtime injection 模块  
**Storage**: N/A（只调整 token key 文本）  
**Testing**: `bun test`  
**Target Platform**: OpenCode plugin runtime  
**Project Type**: library/plugin  
**Performance Goals**: 只改一条 token key 文案，不新增查询  
**Constraints**: 不改 `Work` line、不改 economics、不改 snapshot/timeline/footer、不改 schema、不改 worker runtime  
**Scale/Scope**: 单一 token key clarifier 对齐

## Constitution Check

- 继续沿 `claude-mem` 主线，只补一个具体可见差距
- 使用可见 `spec / plan / tasks` 工件
- 先写失败测试，再实现
- 不扩展到 embedding / vector / runtime 其他层

## Project Structure

### Documentation (this feature)

```text
specs/052-token-key-read-clarifier/
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

**Structure Decision**: 只调整 `[TOKEN KEY]` 的 `Read` line；compaction 只做回归确认。

## Complexity Tracking

本轮无额外复杂度豁免。
