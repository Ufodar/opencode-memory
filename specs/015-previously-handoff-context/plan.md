# Implementation Plan: Previously Handoff Context

**Branch**: `[015-previously-handoff-context]` | **Date**: 2026-03-16 | **Spec**: [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/015-previously-handoff-context/spec.md](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/015-previously-handoff-context/spec.md)
**Input**: Feature specification from `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/015-previously-handoff-context/spec.md`

## Summary

补上和 `claude-mem` 当前仍然存在的一个真实差距：在当前 session 已经有 assistant 文本消息时，把最后一条 assistant 文本以 `Previously` section 的形式编进 system context。实现方式保持最小化：不新增数据库字段，不改变 summary / observation 生成，只在 plugin 侧读取最后一条 assistant 文本，并把这个可选字符串传给 worker 的 system context builder。

## Technical Context

**Language/Version**: TypeScript + Bun  
**Primary Dependencies**: `@opencode-ai/plugin`、`@opencode-ai/sdk`、现有 worker HTTP/runtime  
**Storage**: 无新增存储；继续复用现有 SQLite，但本 feature 不写数据库  
**Testing**: `bun test`（目标测试文件）、`bun run typecheck`、`bun run build`  
**Target Platform**: OpenCode plugin runtime + 本地 memory worker  
**Project Type**: OpenCode memory plugin / worker-backed library  
**Performance Goals**: 读取 session messages 时只做轻量筛选和文本整理，不引入新的持久化开销  
**Constraints**: 不改变 compaction context；不新增 schema；不把 prior assistant message 持久化  
**Scale/Scope**: 仅覆盖当前 session 的最后一条 assistant 文本，并接入 system context 与 preview

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 保持 spec 驱动：通过 `015` spec / plan / tasks 可见化推进，满足。
- 保持 `claude-mem` 对照：本 feature 明确只补 `Previously` 差距，满足。
- 保持最小主线：不碰 retrieval / compaction / embedding / schema，满足。
- 测试先行：先写 system context / preview 的失败测试，再改实现，满足。

## Project Structure

### Documentation (this feature)

```text
specs/015-previously-handoff-context/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts
├── runtime/
│   ├── handlers/
│   │   └── system-transform.ts
│   ├── hooks/
│   └── injection/
│       ├── curated-context-text.ts
│       ├── compiled-context.ts
│       └── system-context.ts
├── services/
│   └── memory-worker-service.ts
├── tools/
│   └── memory-context-preview.ts
└── worker/
    └── protocol.ts

tests/
├── runtime/
│   └── system-context.test.ts
└── tools/
    └── memory-context-preview.test.ts
```

**Structure Decision**: 继续保持当前 `plugin -> worker -> context builder` 结构。plugin 侧新增“读取上一条 assistant 文本”的能力；worker 协议只增加一个可选字段；最终仍由 `system-context` / `compiled-context` 集中决定如何渲染 `Previously`。

## Complexity Tracking

本 feature 无额外复杂度豁免。保持最小实现：

- 不新增 repository / schema
- 不改变 compaction
- 不新增独立 service 进程
