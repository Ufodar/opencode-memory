# Implementation Plan: Evidence-Aware Memory

**Branch**: `[001-evidence-aware-memory]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/001-evidence-aware-memory/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/001-evidence-aware-memory/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/001-evidence-aware-memory/spec.md`

## Summary

这一轮不新增新的 memory 类型，也不做 embedding。  
只做一件事：把已经落库的 observation evidence，真正接进 `detail / timeline / context` 三条消费链，让 `opencode-memory` 在这一层继续向 `claude-mem` 对齐。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`、真实 OpenCode host smoke  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**: 不破坏当前主闭环；context 继续 obey budget；host smoke 继续通过  
**Constraints**:
- 不引入向量层
- 不引入新的外部服务
- 不退化成原始 payload dump
- 不破坏现有 summary-first discipline  
**Scale/Scope**: 单 feature，限定在 evidence consumption 层

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是
- 是否发散到向量/embedding：否
- 是否维持可验证闭环：是
- 是否继续保留本地优先和现有 runtime 结构：是

## Project Structure

### Documentation

```text
specs/001-evidence-aware-memory/
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
src/
├── memory/
│   └── contracts.ts
├── runtime/
│   └── injection/
│       ├── system-context.ts
│       └── compaction-context.ts
├── storage/
│   └── sqlite/
│       ├── mappers.ts
│       ├── retrieval-query-service.ts
│       └── memory-store.ts
└── tools/
    ├── memory-details.ts
    ├── memory-timeline.ts
    └── memory-context-preview.ts

tests/
├── storage/
├── tools/
└── runtime/
```

**Structure Decision**: 保持当前单项目结构，不新增新模块层；只在现有 retrieval/context/contracts 边界内推进。

## 设计决策

### 决策 1：先增强消费层，不继续增强 capture 层

原因：

- capture 层刚补完 evidence 字段
- 当前主线差距在“这些字段有没有被后续使用”
- 再继续加 capture 字段会导致 schema 先膨胀、体验不变

### 决策 2：timeline 只补最小必要 evidence 视图

原因：

- timeline 不是 detail
- 如果直接把全部 detail 字段塞进 timeline，会让对象变重、语义混乱

### 决策 3：context 只带 evidence hint，不带原始 payload

原因：

- 这一步要继续遵守 current budget discipline
- 目标是让模型知道“结论主要来自哪”，不是把历史日志重新喂一遍

## Implementation Phases

### Phase 1：Detail 对齐

目标：

- 让 `memory_details` 稳定暴露新增 evidence 字段

输出：

- contracts 和 detail mapper 调整
- detail 工具测试补齐

### Phase 2：Timeline 对齐

目标：

- 让 `memory_timeline` observation item 能带最小必要 evidence 视图

输出：

- timeline item contract 调整
- retrieval query service 映射更新
- timeline 工具测试补齐

### Phase 3：Context 对齐

目标：

- system / compaction context 能在 budget 内带出 evidence hint

输出：

- evidence hint 生成规则
- system / compaction builder 测试补齐

### Phase 4：Regression 验证

目标：

- 确认 detail / timeline / context 三条链都变强，且主闭环未坏

输出：

- 全量测试
- host smoke

