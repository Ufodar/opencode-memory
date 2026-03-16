# 功能规格：Context Economics

**Feature Branch**: `[021-context-economics]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[CONTINUITY]`
- `[CONTEXT INDEX]`
- `[TIMELINE KEY]`
- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`
- `[PREVIOUSLY]`

但和 `claude-mem` 的 header 对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只告诉模型“这份 index 怎么用”
- 它还会告诉模型“这份 index 实际压缩了多少过去工作，因此值得先信它，再决定是否下钻”

我们现在已经有 guide，但还没有一段短的 **context economics** 说明。也就是说，模型能看出怎么用 memory，却还不太容易看出“这份 memory 索引到底帮我省掉了多少重新阅读和重新整理成本”。

所以这份规格只解决一个问题：

**在 system context 头部增加一个轻量的 `[CONTEXT ECONOMICS]` section，明确当前 memory index 覆盖了多少 summary、多少直接 observation，以及多少 observation 已经被 summary 吸收。**

这轮保持保守：

- 不伪造 token 数字
- 不新增数据库字段
- 不修改 retrieval 行为
- 不把 economics section 带进 compaction context

## 用户场景与测试

### 用户故事 1 - system context 先说明这份索引覆盖了多少过去工作 (Priority: P1)

当 system context 被注入给模型时，我希望在头部看到一段短的 `[CONTEXT ECONOMICS]`，告诉模型当前这份 memory index 里有多少 summary、多少未被 summary 覆盖的 observation，以及多少 observation 已经被 summary 压缩吸收。

**为什么这个优先级最高**：这是 `claude-mem` 当前仍领先我们的一条 header 成熟度差距。它不是新增 memory 数据，而是让模型更明确地知道“这份索引值不值得先信”。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出中包含 `[CONTEXT ECONOMICS]`，并明确出现 summary 数量、直接 observation 数量、covered observation 数量。

**验收场景**：

1. **Given** system context 同时拿到 summaries 和 observations，**When** 输出生成，**Then** 头部必须包含 `[CONTEXT ECONOMICS]`。
2. **Given** summaries 覆盖了部分 observation，**When** 输出生成，**Then** economics section 必须明确说明 covered observations 数量。
3. **Given** 没有 summaries，**When** 输出生成，**Then** economics section 仍然必须说明 observation 数量，但 covered observations 数量应为 0。

---

### 用户故事 2 - compaction context 不引入 economics 说明 (Priority: P2)

当 compaction context 生成时，我不希望把 system header 的 `[CONTEXT ECONOMICS]` 原样带进去，避免压缩 prompt 里增加只对运行时消费有用的额外说明。

**为什么这个优先级排第二**：这保证 economics section 只服务 system context，不污染 compaction prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证输出中不包含 `[CONTEXT ECONOMICS]`。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 `[CONTEXT ECONOMICS]`。

## 边界情况

- 这段 economics 说明必须短，不能把 snapshot 和 timeline 顶掉。
- `covered observations` 统计必须基于已注入 summaries 的 `observationIDs`，而不是全库总量。
- 没有 summary 时，`covered observations` 必须为 0。
- 没有 observation 时，也必须能稳定输出而不是缺段。

## 需求

### 功能需求

- **FR-001**：system context 必须在头部包含 `[CONTEXT ECONOMICS]` section。
- **FR-002**：该 section 必须明确显示 injected summaries 的数量。
- **FR-003**：该 section 必须明确显示直接注入的 observation 数量。
- **FR-004**：该 section 必须明确显示已被 injected summaries 覆盖的 observation 数量。
- **FR-005**：该 section 必须使用真实计数，不得伪造 token 数字。
- **FR-006**：compaction context 不得复用这段 `[CONTEXT ECONOMICS]` section。
- **FR-007**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 timeline 结构。

### 关键实体

- **Context Economics Section**：system context 头部的一段短说明，用于告诉模型当前 memory index 覆盖的 summary / observation 规模，以及已有多少 observation 被 summary 吸收。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现 `[CONTEXT ECONOMICS]`。
- **SC-002**：该 section 明确显示 summary 数量、observation 数量、covered observation 数量。
- **SC-003**：没有 summary 时，covered observation 数量稳定显示为 0。
- **SC-004**：compaction context 不出现 `[CONTEXT ECONOMICS]`。
- **SC-005**：这轮不引入新 schema，也不改变 timeline / retrieval 现有行为。
