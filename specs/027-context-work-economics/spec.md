# 功能规格：Context Work Economics

**Feature Branch**: `[027-context-work-economics]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线对齐功能，并继续按 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT ECONOMICS]` 只有三类条数：

- summaries
- direct observations
- covered observations

但和 `claude-mem` 的 `renderMarkdownContextEconomics()` 对照后，当前最具体的一条剩余差距是：

- `claude-mem` 会继续告诉模型：
  - 读取这份 index 现在大概要花多少 token
  - 过去这些工作大概投入了多少 work token
  - 现在复用这份 index，大概省了多少 token
- 我们现在还没有这层量化

所以这份规格只解决一个问题：

**在不改 schema、不引入 embedding、不引入新检索层的前提下，给 `[CONTEXT ECONOMICS]` 补上 deterministic 的 `Loading / Work investment / Your savings` 估算。**

这轮保持保守：

- 不改数据库 schema
- 不改 worker runtime
- 不改 retrieval 排序
- 不改 timeline section
- 不改 compaction context 的“默认不显示 economics”策略

## 用户场景与测试

### 用户故事 1 - system context 显示 work investment 与 savings (Priority: P1)

当模型看到 `[CONTEXT ECONOMICS]` 时，我希望它不只知道“有几条 summary / observation”，还知道：

- 当前读取这份 memory index 的成本
- 过去为这些 memory 付出的工作投入
- 现在复用这份 index 的节省

这样它才更接近 `claude-mem` 对 memory value 的表达方式。

**为什么这个优先级最高**：这是当前 header 里最明确、最小的一条量化差距；不用动 runtime，只补当前 header 的信息密度。

**独立测试方式**：调用 `buildSystemMemoryContext()`，构造一条 summary 和一条 observation，验证输出中出现：

- `Loading:`
- `Work investment:`
- `Your savings:`

**验收场景**：

1. **Given** 有 summary 和 direct observation，**When** 生成 system context，**Then** `[CONTEXT ECONOMICS]` 中应出现 `Loading`。
2. **Given** 同样输入，**When** 生成 system context，**Then** `[CONTEXT ECONOMICS]` 中应出现 `Work investment`。
3. **Given** 同样输入，**When** 生成 system context，**Then** `[CONTEXT ECONOMICS]` 中应出现 `Your savings`。

### 用户故事 2 - 零 summary 场景仍给出可用 economics (Priority: P2)

当当前只有 direct observation、还没有 summary 时，我仍希望 `[CONTEXT ECONOMICS]` 可以给出可用的估算，而不是只在 summary 存在时才成立。

**为什么这个优先级排第二**：system context 在 request 早期也会注入 memory；如果只有 summary 才能算 economics，这一层就不稳定。

**独立测试方式**：调用 `buildSystemMemoryContext()`，构造只有 observation 的输入，验证仍然显示三条 economics 文本。

**验收场景**：

1. **Given** 只有 direct observation，**When** 生成 system context，**Then** `[CONTEXT ECONOMICS]` 仍显示 `Loading / Work investment / Your savings`。

## 边界情况

- 这轮所有 token 都是 deterministic estimate，不声称是模型真实账单。
- 估算只基于当前已有 summary / observation 字段，不新增持久化字段。
- `Your savings` 允许为 `0%`，但不允许为负值。
- compaction context 继续不显示 `[CONTEXT ECONOMICS]`。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT ECONOMICS]` 必须显示 `Loading` 估算。
- **FR-002**：system context 的 `[CONTEXT ECONOMICS]` 必须显示 `Work investment` 估算。
- **FR-003**：system context 的 `[CONTEXT ECONOMICS]` 必须显示 `Your savings` 估算。
- **FR-004**：上述三项估算必须只依赖当前已有 summary / observation 字段，不能新增数据库 schema。
- **FR-005**：`Your savings` 必须基于 `Work investment - Loading` 计算，并对负值进行归零。
- **FR-006**：compaction context 继续不显示 `[CONTEXT ECONOMICS]`。

### 关键实体

- **Loading Estimate**：当前模型读取这份 memory index 的估算成本。
- **Work Investment Estimate**：这些 summary / observation 背后原始工作投入的估算成本。
- **Savings Estimate**：相对重新做一遍这些工作，现在通过当前 index 节省的估算成本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中的 `[CONTEXT ECONOMICS]` 同时出现 `Loading / Work investment / Your savings`。
- **SC-002**：只有 observation 时，这三项估算仍然存在。
- **SC-003**：compaction context 行为不变，仍不出现 `[CONTEXT ECONOMICS]`。
- **SC-004**：不修改数据库 schema，不新增 worker/runtime 复杂度。
