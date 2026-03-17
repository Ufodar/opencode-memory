# Implementation Plan: Loading Observations Wording

**Branch**: `[060-loading-observations-wording]` | **Date**: 2026-03-17 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/060-loading-observations-wording/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/060-loading-observations-wording/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/060-loading-observations-wording/spec.md`

## Summary

当前 `[CONTEXT ECONOMICS]` 已经有完整四行，但 `Loading` 行的数量单位还写成 `records`。本轮只把它改成 `observations`，保持其它 economics 文案不变。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun test, OpenCode runtime integration  
**Storage**: N/A  
**Testing**: `bun test`  
**Target Platform**: 本地 OpenCode plugin / Bun runtime  
**Project Type**: library/plugin  
**Performance Goals**: 不新增运行时开销  
**Constraints**: 只改 system context wording，不改其它 section  
**Scale/Scope**: 单行 economics 文案对齐

## Constitution Check

本轮只做一个可见 wording 差距，对齐 `claude-mem` 同位置输出；不扩展功能面，通过。

## Project Structure

### Documentation (this feature)

```text
specs/060-loading-observations-wording/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/runtime/injection/
└── curated-context-text.ts

tests/runtime/
└── system-context.test.ts
```

**Structure Decision**: 只修改 context economics 文本生成函数和对应 runtime 测试。
