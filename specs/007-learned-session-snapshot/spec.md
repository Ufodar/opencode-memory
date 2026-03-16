# 功能规格：Learned Session Snapshot

**Feature Branch**: `[007-learned-session-snapshot]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每一步都先对照 `claude-mem` 判断是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[LATEST SESSION SNAPSHOT]`
  - `Current Focus`
  - `Completed`
  - `Next`

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 的最近一轮 summary 字段里，还会明确区分“这轮学到了什么”
- 我们现在只能从 timeline 里猜到这一层
- 还没有一个单独的 `Learned` 字段

所以这份规格只解决一个问题：

**让 latest snapshot 也能显示一条简短的 `Learned`，直接告诉当前会话“这轮具体发现了什么”。**

## 用户场景与测试

### 用户故事 1 - system context 应直接显示最新一轮学到的关键点 (Priority: P1)

当 latest summary 关联了 observation 时，我希望 system context 能在 snapshot 里直接显示一条 `Learned`，而不是逼当前会话去 timeline 里自己猜。

**为什么这个优先级最高**：这是当前和 `claude-mem` 最直接的字段差距，而且能明显提高 re-entry 理解速度。

**独立测试方式**：构造 latest summary 和其 covered observation，调用 `buildSystemMemoryContext()` 即可验证。

**验收场景**：

1. **Given** latest summary 关联了一条 observation，**When** 构建 system context，**Then** snapshot 应新增 `Learned`
2. **Given** latest summary 没有关联 observation，**When** 构建 system context，**Then** snapshot 可以不显示 `Learned`

### 用户故事 2 - compaction 也应保留这条 learned field (Priority: P2)

当 compaction context 保留 latest snapshot 时，我希望同样能看到这条 `Learned`。

**为什么这个优先级排第二**：system / compaction 需要继续共用 context builder 纪律。

**独立测试方式**：构造 latest summary 和其 covered observation，调用 `buildCompactionMemoryContext()` 即可验证。

## 边界情况

- 如果 covered observation 很长，`Learned` 也必须做 deterministic 短文本编译。
- 如果 latest summary 没有关联 observation，则不要伪造 `Learned`。
- 不能因为新增 `Learned` 破坏当前 `Current Focus / Completed / Next`。
- 不能因为新增 `Learned` 再把 timeline 或 summary 去重规则打乱。

## 需求

### 功能需求

- **FR-001**：当 latest summary 关联 covered observation 时，latest snapshot 必须可以显示 `Learned`。
- **FR-002**：`Learned` 必须来自 summary 对应的 observation 证据，而不是凭空编造。
- **FR-003**：`Learned` 必须经过 deterministic 短文本编译。
- **FR-004**：当没有 covered observation 时，snapshot 可以跳过 `Learned`。
- **FR-005**：system context 和 compaction context 必须保持一致的 `Learned` 编译风格。

## 成功标准

### 可衡量结果

- **SC-001**：system preview 中，latest snapshot 直接出现 `Learned`。
- **SC-002**：`Learned` 基于真实 covered observation，而不是重复 `Completed`。
- **SC-003**：compaction 也保留该字段。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build` 继续通过。
