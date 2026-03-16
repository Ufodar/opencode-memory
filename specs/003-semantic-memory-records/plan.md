# Implementation Plan: Semantic Memory Records

**Branch**: `[003-semantic-memory-records]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/003-semantic-memory-records/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/003-semantic-memory-records/spec.md)
**Input**: 功能规格来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/003-semantic-memory-records/spec.md`

## Summary

这一轮不新增向量层，也不改 retrieval tool surface。  
只做一件事：

**把 memory record 从“原始工具日志”推进到“更像工作发现”的语义记录。**

第一阶段优先做 deterministic 提升，直接改进：

- `read` observation
- summary 聚合
- `memory_context_preview / RESUME GUIDE`

第二阶段保留并正式接入已有的 observation model 精炼链，但它必须是可选增强，不得成为主闭环前提。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: Bun runtime、OpenCode plugin API、SQLite、本地独立 worker  
**Storage**: SQLite (`memory.sqlite`)  
**Testing**: `bun test`、`bun run typecheck`、`bun run build`、真实 OpenCode host smoke  
**Target Platform**: 本地 OpenCode plugin + 独立 worker  
**Project Type**: 本地插件 + worker runtime  
**Performance Goals**:
- preview 输出更语义化
- 不引入额外宿主阻塞
- observation model 超时后必须快速回退  
**Constraints**:
- 不改 tool surface
- 不发散到 embedding / vector
- 不破坏现有 worker lifecycle、timeout、queue 和 fallback 纪律
- 不把原始 `<content>` payload 整段灌进 memory  
**Scale/Scope**: 单 feature，限定在 observation / summary / injected context 的文本质量提升

## Constitution Check

- 是否仍沿 `claude-mem` 主线：是  
  当前 `claude-mem` 在这一层更强的是 observation / context 的语义质量，而不是额外工具面。
- 是否发散到向量/embedding：否
- 是否保持可验证闭环：是
- 是否继续本地优先、worker-first：是

## Project Structure

### Documentation

```text
specs/003-semantic-memory-records/
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
├── memory/
│   ├── observation/
│   │   ├── candidate.ts
│   │   └── types.ts
│   └── summary/
│       └── aggregate.ts
├── runtime/
│   ├── hooks/
│   │   └── tool-after.ts
│   └── injection/
│       ├── compiled-context.ts
│       └── system-context.ts
├── services/
│   ├── ai/
│   │   ├── model-observation.ts
│   │   └── model-summary.ts
│   └── memory-worker-service.ts
└── worker/
    └── server.ts

tests/
├── runtime/
├── observation/
├── services/
└── testing/
```

**Structure Decision**: 保持当前单项目结构，不新增新进程或新存储层；只沿现有 worker + capture + summary + context builder 主线推进。

## Phase 0 Research Decisions

1. 先用 deterministic `read` 内容摘要提升语义质量  
   原因：真实宿主 `read` 输出已经包含 `<content>...</content>`，不需要先依赖模型也能明显改善。

2. observation model 只做可选增强  
   原因：当前仓里已有 `model-observation.ts`，但主闭环不能依赖它。必须先保证 deterministic 结果已经够用。

3. summary / resume 只复用改进后的 observation 结果，不再单独创造第二套摘要逻辑  
   原因：这样能让 preview、summary、resume 三条链一起受益，避免文本风格再次分叉。

## Phase 1 Design Artifacts

### Data Model Impact

- 不新增数据库表
- 不新增新的 memory kind
- observation record 结构保持现有 shape：
  - `content`
  - `output.summary`
  - `retrieval.tags`
  - `retrieval.importance`
  - `trace`
- 变化点在于这些字段的生成质量和消费效果

### Contract Impact

- `memory_details` / `memory_timeline` 的返回结构不需要新增字段
- 但其 `content / output.summary / RESUME GUIDE` 的语义质量会提升
- `memory_context_preview` 的 section 结构保持不变，文本质量提升

### Agent Context Update

- 本轮不新增 agent 类型
- `opencode` 的 speckit commands 已安装在 `.opencode/command/`
- 后续 spec 继续沿此结构推进

## Implementation Phases

### Phase 1：Deterministic Semantic Observation

目标：
- 让 `read` observation 基于 `<content>` 生成可恢复工作的语义摘要

输出：
- `tool-after.ts` 中更强的 `read` 摘要逻辑
- 对应 runtime tests

### Phase 2：Semantic Summary / Resume Propagation

目标：
- 让 summary 聚合和 `RESUME GUIDE` 直接受益于新的 semantic observation

输出：
- `aggregate.ts` 仍沿现有主线，但 tests 明确验证结果已不再是原始路径短语
- `compiled-context.ts` / `system-context.ts` 对应断言补齐

### Phase 3：Optional Model Observation Refinement

目标：
- 把已有 `model-observation.ts` 正式纳入本轮 spec 的可见范围
- 有配置时增强，没有配置时自动回退

输出：
- worker service / tests / docs 对齐

### Phase 4：Regression & Host Verification

目标：
- 证明真实宿主 preview 已从“原始工具日志”提升到“语义工作记录”

输出：
- 全量测试
- host smoke
- preview 证据文件
