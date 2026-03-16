# Implementation Plan: Curated Memory Context

**Branch**: `[004-curated-memory-context]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/004-curated-memory-context/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/004-curated-memory-context/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/004-curated-memory-context/spec.md`

## Summary

这一轮不改数据库，不新增 tool，不碰 embedding。

只做一件事：

**把当前注入给会话的 memory text，从“长串摘抄”收成更像工作索引的短摘要。**

重点覆盖三条现有输出链：

- `[MEMORY SUMMARY]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

技术策略是：

- 保持当前 `summary / observation` 落库结果不变
- 在 context builder 阶段新增 deterministic “编译/裁剪”规则
- system context 和 compaction context 复用同一套短文本规则

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite、本地独立 worker  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`、真实 OpenCode host smoke  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**:
- context preview 更短、更清楚
- 不增加额外模型调用
- 不增加 worker 主链阻塞  
**Constraints**:
- 不改 retrieval tool surface
- 不新增持久化字段
- 不发散到 embedding / vector
- 不破坏 summary-first retrieval / injection
- 不破坏 worker / queue / timeout 纪律  
**Scale/Scope**: 单 feature，只收 system / compaction context builder 的输出质量

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 context builder 的成熟度，而不是能力缺口。
- 是否新增额外模型依赖：否
- 是否继续保持 deterministic-first：是
- 是否保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/004-curated-memory-context/
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
├── runtime/
│   └── injection/
│       ├── compiled-context.ts
│       ├── system-context.ts
│       ├── compaction-context.ts
│       └── evidence-hints.ts
├── memory/
│   ├── observation/
│   │   └── types.ts
│   └── summary/
│       └── types.ts
└── tools/
    └── memory-context-preview.ts

tests/
├── runtime/
│   ├── system-context.test.ts
│   └── compaction-context.test.ts
└── testing/
```

**Structure Decision**: 保持当前单项目结构，不改 worker / store / queue；只在 context builder 一侧新增 deterministic 编译规则，并用现有 preview / smoke 验证真实效果。

## Phase 0 Research Decisions

1. **在 context builder 阶段做“编译”，不回写数据库**  
   原因：当前差距是注入文本质量，而不是落库结构错误。直接改编译层最小、最稳。

2. **system context 和 compaction context 共用同一套短文本规则**  
   原因：两条链都在消费相同的 summary / observation，如果规则分叉，很快又会出现输出风格漂移。

3. **优先 deterministic curation，不引入新的模型调用**  
   原因：当前已经能从真实输出看清问题，没必要用新模型去掩盖 context builder 规则不成熟。

## Phase 1 Design Artifacts

### Data Model Impact

- 不新增数据库表
- 不新增新的 memory kind
- 不修改 `SummaryRecord` / `ObservationRecord` 落库 shape
- 变化只发生在：
  - summary line 编译
  - timeline line 编译
  - resume action 编译

### Contract Impact

- `memory_context_preview` 返回结构不变：
  - `success`
  - `lineCount`
  - `lines`
- `system transform` / `compaction` 输入输出接口不变
- 变化是 `lines` 的内容更短、更结构化

### Agent Context Update

- 不新增 agent 类型
- 继续使用 `.opencode/command/speckit.*` 和 `.specify/scripts/bash/*`
- 下一轮实现仍沿 `spec -> plan -> tasks` 公开推进

## Implementation Phases

### Phase 1：Curated Summary Lines

目标：
- 把 `MEMORY SUMMARY` 从长串 `outcomeSummary` 改成更短的阶段摘要行

输出：
- summary line 编译 helper
- 对应 system context 测试

### Phase 2：Curated Timeline Items

目标：
- 把 timeline item 从长 observation 文本收成短 checkpoint 行

输出：
- timeline line 编译 helper
- 对应 system / compaction context 测试

### Phase 3：Action-Oriented Resume Guide

目标：
- 优先输出短动作恢复提示，而不是重复整条 long summary

输出：
- resume guide 编译规则
- 对应 system context 测试

### Phase 4：Regression & Host Verification

目标：
- 证明真实宿主 preview 已从“长串摘抄”变成“更像工作索引”

输出：
- 全量测试
- host smoke
- preview 证据文件
