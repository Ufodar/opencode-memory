# Implementation Plan: Fielded Session Snapshot

**Branch**: `[005-fielded-session-snapshot]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/005-fielded-session-snapshot/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/005-fielded-session-snapshot/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/005-fielded-session-snapshot/spec.md`

## Summary

这一轮不改 worker，不改数据库，不加 tool。

只做一件事：

**把最新一条 summary 编译成一个更明确的 session snapshot，让当前会话能一眼看出最近一轮“在做什么 / 完成了什么 / 接下来做什么”。**

技术策略是：

- 不新增持久化字段
- 只用现有：
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`
- 在 context builder 阶段新增 deterministic snapshot 编译
- system / compaction 共用同一套 snapshot 编译思路

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite、本地独立 worker  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`、真实 OpenCode host smoke  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**:
- 让当前会话更快理解最近一轮工作快照
- 不增加模型调用
- 不增加 worker 主链阻塞  
**Constraints**:
- 不改 retrieval tool surface
- 不新增数据库字段
- 不发散到 embedding / vector
- 不破坏已有 curated context
- 不破坏 worker / queue / smoke  
**Scale/Scope**: 单 feature，只收 latest summary 的编译质量

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前差距已经收缩到 context builder 的“工作索引组织方式”。
- 是否新增额外模型依赖：否
- 是否仍 deterministic-first：是
- 是否继续保持可验证闭环：是

## Project Structure

### Documentation

```text
specs/005-fielded-session-snapshot/
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
│       ├── curated-context-text.ts
│       ├── compiled-context.ts
│       └── compaction-context.ts
├── memory/
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

**Structure Decision**: 不改变 summary 存储 shape，只在 context builder 侧新增 session snapshot 编译规则。

## Phase 0 Research Decisions

1. **session snapshot 只用 latest summary 构建**  
   原因：这一轮要解决的是“最近一轮工作快照”，不是再做多轮 timeline 聚合。

2. **使用已有字段，不新增数据库字段**  
   原因：当前差距在“怎么展示”，不是“存少了哪些字段”。

3. **system / compaction 共享 snapshot 编译规则**  
   原因：前几轮已经证明两边一旦分叉，很快又会出现风格漂移。

## Phase 1 Design Artifacts

### Data Model Impact

- 不新增数据库字段
- 不改 `SummaryRecord`
- 新增的是运行时编译概念：
  - `Session Snapshot`
  - `Snapshot Fields`

### Contract Impact

- `memory_context_preview` 返回结构不变
- system / compaction 输入输出不变
- 变化在于新增一组更明确的 lines

### Agent Context Update

- 不新增 agent 类型
- 继续使用 `.opencode/command/speckit.*`
- 继续沿 `spec -> plan -> tasks` 公开推进

## Implementation Phases

### Phase 1：Build Snapshot Fields

目标：
- 从 latest summary 编译出更明确的字段：
  - current focus / request
  - completed
  - next / resume direction

输出：
- snapshot field 编译 helper
- system context 测试

### Phase 2：Render Snapshot Into System Context

目标：
- 在 current memory preview 里加入更明确的 latest session snapshot

输出：
- `compiled-context.ts` 调整
- preview / system context 测试

### Phase 3：Mirror Snapshot Into Compaction Context

目标：
- compaction 也保留这份最近一轮工作快照

输出：
- `compaction-context.ts` 调整
- compaction 测试

### Phase 4：Regression & Host Verification

目标：
- 证明真实宿主 preview 已更容易回答：
  - 刚才在做什么
  - 完成了什么
  - 该接着做什么

输出：
- 全量测试
- host smoke
- preview 证据文件
