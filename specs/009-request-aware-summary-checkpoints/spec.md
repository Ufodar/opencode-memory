# 功能规格：Request Aware Summary Checkpoints

**Feature Branch**: `[009-request-aware-summary-checkpoints]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- older summaries 已进入 `[MEMORY TIMELINE]`
- timeline 里现在会显示：
  - `- [summary] 已整理 smoke 前置条件并记录到 checklist.md`

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 的 summary timeline item 会带 request 标题
- 我们现在的 `[summary]` 只有 outcome
- 当前会话仍然不够容易看出：
  - 这条 summary checkpoint 当时是围绕什么 request 形成的

所以这份规格只解决一个问题：

**让 summary checkpoint 也带 request 语义，而不是只有 outcome 片段。**

## 用户场景与测试

### 用户故事 1 - system timeline 的 summary checkpoint 应带 request 语义 (Priority: P1)

当 older summary 进入 `[MEMORY TIMELINE]` 时，我希望它不只显示 outcome，还能直接带出 request 语义，让当前会话知道“这条 checkpoint 当时在做什么”。

**为什么这个优先级最高**：这是当前 unified timeline 和 `claude-mem` 之间最直接、最具体的剩余差距。

**独立测试方式**：构造 latest summary 与 older summary，调用 `buildSystemMemoryContext()` 验证 summary checkpoint 文本。

**验收场景**：

1. **Given** older summary 有 requestSummary 与 outcomeSummary，**When** 构建 system context，**Then** timeline 里的 `[summary]` 应同时带 request 与 outcome
2. **Given** older summary 没有 requestSummary，**When** 构建 system context，**Then** timeline 里的 `[summary]` 仍可退化为 outcome-only

### 用户故事 2 - compaction 的 summary checkpoint 也应带 request 语义 (Priority: P2)

当 compaction context 渲染统一 timeline checkpoint 时，我希望同样能看到 request 语义，而不是只有 outcome。

**为什么这个优先级排第二**：system / compaction 需要继续共用同一套 summary checkpoint 编译纪律。

**独立测试方式**：构造 latest summary 与 older summary，调用 `buildCompactionMemoryContext()` 验证。

## 边界情况

- requestSummary 很长时，必须 deterministic 短编译。
- requestSummary 缺失时，不应伪造。
- 不应因为加上 request 语义就让 checkpoint 重新变成长段 summary。
- 不能破坏 `008` 的 unified timeline 纪律。

## 需求

### 功能需求

- **FR-001**：summary checkpoint 应优先显示 request 语义。
- **FR-002**：如果 requestSummary 存在，summary checkpoint 应包含 request 与 outcome 的组合信息。
- **FR-003**：如果 requestSummary 不存在，summary checkpoint 可以退化为 outcome-only。
- **FR-004**：system / compaction 必须共享同一套 request-aware summary checkpoint 编译规则。
- **FR-005**：summary checkpoint 文本仍必须 deterministic、短且可去重。

## 成功标准

### 可衡量结果

- **SC-001**：system timeline 中的 `[summary]` 能直接看出该 checkpoint 当时围绕什么 request。
- **SC-002**：compaction timeline checkpoint 也使用同样的 request-aware 格式。
- **SC-003**：`bun test`、`bun run typecheck`、`bun run build` 继续通过。
