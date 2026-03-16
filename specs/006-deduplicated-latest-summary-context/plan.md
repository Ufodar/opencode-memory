# Implementation Plan: Deduplicated Latest Summary Context

**Branch**: `[006-deduplicated-latest-summary-context]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/006-deduplicated-latest-summary-context/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/006-deduplicated-latest-summary-context/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/006-deduplicated-latest-summary-context/spec.md`

## Summary

这一轮不改 worker，不改数据库，不加 tool。

只解决一个真实 preview 噪声：

**latest summary 已经被编译成 snapshot 后，不应再在 `MEMORY SUMMARY` / `Recent memory summaries:` 里重复显示。**

技术策略是：

- 继续保留 latest snapshot
- system / compaction 都只跳过最新一条 summary
- 更早的 summaries 继续保留
- 如果 latest summary 无法编译成 snapshot，则不做错误隐藏

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite、本地独立 worker  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**:
- 去掉最新 summary 的重复渲染
- 不增加模型调用
- 不增加新的 worker 主链阻塞  
**Constraints**:
- 不改数据库字段
- 不改 summary schema
- 不发散到 retrieval / embedding / vector
- 不破坏 timeline 和 resume guide  
**Scale/Scope**: 单 feature，只收 latest summary 的重复显示

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 context builder 的去重与组织纪律。
- 是否新增额外模型依赖：否
- 是否继续保持 deterministic-first：是
- 是否继续保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/006-deduplicated-latest-summary-context/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code

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

**Structure Decision**: 这轮只调 latest summary 在 context builder 里的显示纪律，不改存储层。

## Phase 0 Research Decisions

1. **只跳过最新一条 summary**
   - 因为本轮要解决的是“latest summary 重复”，不是“历史 summary 全部折叠”

2. **snapshot 成功时才去重**
   - 避免 snapshot 没生成时，latest summary 又被错误隐藏

3. **system / compaction 继续共用同一套纪律**
   - 避免两边再次漂移

## Phase 1 Design Artifacts

### Data Model Impact

- 不新增数据库字段
- 不改 `SummaryRecord`
- 只新增运行时选择逻辑：
  - latest summary
  - remaining summaries

### Contract Impact

- `memory_context_preview` 返回结构不变
- system / compaction 输入输出不变
- 变化只是：
  - latest summary 不再重复渲染

## Implementation Phases

### Phase 1：System Context Latest-Summary Dedup

目标：
- 当 latest snapshot 已经出现时，`MEMORY SUMMARY` 只保留更早 summaries

### Phase 2：Compaction Latest-Summary Dedup

目标：
- compaction 也沿用同样的 latest-summary 去重纪律

### Phase 3：Regression & Documentation

目标：
- 确认没有破坏：
  - snapshot
  - timeline
  - resume guide
  - 全量测试与构建
