# 功能规格：Summary Checkpoints In Timeline

**Feature Branch**: `[008-summary-checkpoints-in-timeline]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照判断下一步是否还在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- latest summary 会先编译成 `[LATEST SESSION SNAPSHOT]`
- 更早的 summaries 会落在 `[MEMORY SUMMARY]`
- observations 会落在 `[MEMORY TIMELINE]`

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 的 timeline 是统一时间线
- summary milestone 会直接混入 timeline
- 我们现在仍然把：
  - 历史 summaries
  - observations
  分成两块

所以这份规格只解决一个问题：

**让 older summaries 不再单独待在 `[MEMORY SUMMARY]`，而是作为 summary checkpoint 进入 `[MEMORY TIMELINE]`。**

## 用户场景与测试

### 用户故事 1 - system context 应把 older summary 当成 timeline checkpoint (Priority: P1)

当存在 latest snapshot 之外的 older summaries 时，我希望当前会话能在 `[MEMORY TIMELINE]` 里直接看到这些 summary checkpoint，而不是再跳去另一个 section。

**为什么这个优先级最高**：这正是当前和 `claude-mem` 在 context builder 组织方式上的直接差距。

**独立测试方式**：构造 latest summary、older summary、以及一条 unsummarized observation，调用 `buildSystemMemoryContext()` 验证。

**验收场景**：

1. **Given** latest summary 与 older summary 同时存在，**When** 构建 system context，**Then** older summary 应作为 timeline checkpoint 出现在 `[MEMORY TIMELINE]`
2. **Given** older summary 已进入 timeline，**When** 构建 system context，**Then** `[MEMORY SUMMARY]` 不应再重复保留它

### 用户故事 2 - compaction 也应使用统一 timeline checkpoint (Priority: P2)

当 compaction context 保留最近工作索引时，我希望它也用同样的统一 timeline，而不是继续拆成：

- `Recent memory summaries`
- `Recent unsummarized observations`

**为什么这个优先级排第二**：system / compaction 需要继续共用同一套 context builder 纪律。

**独立测试方式**：构造 latest summary、older summary、以及一条 unsummarized observation，调用 `buildCompactionMemoryContext()` 验证。

## 边界情况

- latest summary 已被 snapshot 吸收后，不应再次作为 timeline checkpoint 重复出现。
- older summary 进入 timeline 后，不应再保留重复的 `[MEMORY SUMMARY]` section。
- summary checkpoint 需要 deterministic 短文本编译，不能把整条长 summary 原样塞进 timeline。
- summary checkpoint 的 `Next` 应保持简短，不破坏当前 budget。
- 如果没有 older summary，则 timeline 继续只显示 observations。

## 需求

### 功能需求

- **FR-001**：older summaries 必须可以作为 summary checkpoint 进入 `[MEMORY TIMELINE]`。
- **FR-002**：latest summary 已被 snapshot 吸收后，不得再以 checkpoint 形式重复进入 timeline。
- **FR-003**：older summaries 进入 timeline 后，`[MEMORY SUMMARY]` 可以为空或直接消失，不得重复渲染同一批内容。
- **FR-004**：system context 和 compaction context 必须保持一致的 summary checkpoint 编译风格。
- **FR-005**：summary checkpoint 必须经过 deterministic 短文本编译。

## 成功标准

### 可衡量结果

- **SC-001**：system preview 中，older summary 直接出现在 `[MEMORY TIMELINE]`。
- **SC-002**：同一条 older summary 不再同时出现在 timeline 和 `[MEMORY SUMMARY]`。
- **SC-003**：compaction 也使用统一 timeline checkpoint。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build` 继续通过。
