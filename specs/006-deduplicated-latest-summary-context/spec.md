# 功能规格：Deduplicated Latest Summary Context

**Feature Branch**: `[006-deduplicated-latest-summary-context]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每一步都先对照 `claude-mem` 判断是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY SUMMARY]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- 最近一轮 summary 已经被编译成 snapshot
- 却又在 `MEMORY SUMMARY` 里重复显示一遍

真实 preview 当前长这样：

```text
[LATEST SESSION SNAPSHOT]
- Current Focus: ...
- Completed: ...
- Next: ...

[MEMORY SUMMARY]
- 已完成……
  Next: …
```

这会导致一个问题：

**最新一轮已经有快照了，但当前 context 还在重复同一条信息。**

所以这份规格只解决一个问题：

**当 latest summary 已经被编译成 snapshot 后，后续 `MEMORY SUMMARY` / compaction summaries 不应再重复渲染它。**

## 用户场景与测试

### 用户故事 1 - 当前会话不应重复显示同一条 latest summary (Priority: P1)

当 system context 已经显示了 latest snapshot 时，我希望后面的 `MEMORY SUMMARY` 只保留更早的 summary，或者在没有更早 summary 时直接不显示该 section。

**为什么这个优先级最高**：这是当前真实 preview 里最明显的重复噪声，也是 `claude-mem` 这一层更成熟的地方。

**独立测试方式**：仅构造 1 条 latest summary 或 2 条 summaries，调用 `buildSystemMemoryContext()` 即可验证。

**验收场景**：

1. **Given** 只有 1 条 latest summary，**When** 构建 system context，**Then** 应显示 snapshot，但不再显示重复的 `MEMORY SUMMARY`
2. **Given** 有 2 条 summaries，**When** 构建 system context，**Then** snapshot 只代表最新一条，而 `MEMORY SUMMARY` 只显示更早的一条

### 用户故事 2 - compaction 也不应重复 latest summary (Priority: P2)

当 compaction context 已经显示 latest session snapshot 时，我希望 `Recent memory summaries:` 不再把同一条 latest summary 再重复一遍。

**为什么这个优先级排第二**：system / compaction 需要继续保持同一套 context builder 纪律，否则很快会再次分叉。

**独立测试方式**：构造 1 条 latest summary 或 2 条 summaries，调用 `buildCompactionMemoryContext()` 即可验证。

**验收场景**：

1. **Given** 只有 1 条 latest summary，**When** 构建 compaction context，**Then** 应保留 snapshot，但不再显示 `Recent memory summaries:`
2. **Given** 有 2 条 summaries，**When** 构建 compaction context，**Then** `Recent memory summaries:` 只显示更早的一条

## 边界情况

- 如果 latest summary 没有可编译字段，则不应盲目隐藏所有 summaries。
- 如果只有旧 summary、没有 latest snapshot，则仍应保留 `MEMORY SUMMARY` / `Recent memory summaries:`
- 不能为了去重而让 timeline 丢失。
- 不能为了去重而删掉 `RESUME GUIDE`。

## 需求

### 功能需求

- **FR-001**：当 latest summary 已成功编译成 snapshot 时，system context 不得在 `MEMORY SUMMARY` 中重复渲染这条 latest summary。
- **FR-002**：当 latest summary 已成功编译成 snapshot 时，compaction context 不得在 `Recent memory summaries:` 中重复渲染这条 latest summary。
- **FR-003**：如果存在更早的 summaries，`MEMORY SUMMARY` / `Recent memory summaries:` 仍应保留这些更早 summaries。
- **FR-004**：如果 latest summary 无法编译成 snapshot，则不得错误地丢失 summaries。
- **FR-005**：system context 和 compaction context 必须保持一致的 latest-summary 去重纪律。

## 成功标准

### 可衡量结果

- **SC-001**：真实 preview 中，不再同时看到 latest snapshot 和其重复 summary。
- **SC-002**：当存在更早 summary 时，历史 summary 仍然保留。
- **SC-003**：compaction context 也遵守同样规则。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build` 继续通过。
