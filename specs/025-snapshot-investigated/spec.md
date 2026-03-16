# 功能规格：Snapshot Investigated

**Feature Branch**: `[025-snapshot-investigated]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线对齐功能，并继续按 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[LATEST SESSION SNAPSHOT]` 已经有：

- `Current Focus`
- `Learned`
- `Completed`
- `Next`

但和 `claude-mem` 的 `SummaryRenderer` 对照后，当前最具体的一条剩余差距是：

- `claude-mem` 会单独显示 `Investigated`
- 它表达的是：这一轮到底查了什么、看了什么
- 我们现在的 `Current Focus` 更像“在做什么”，不是“查了什么”

所以这份规格只解决一个问题：

**当 latest summary 有稳定 evidence 线索时，在 latest session snapshot 里新增 `Investigated` 字段。**

这轮保持保守：

- 不改数据库 schema
- 不改 worker runtime
- 不改 retrieval 排序
- 不改 timeline 主结构

## 用户场景与测试

### 用户故事 1 - system context 的 latest snapshot 显示 `Investigated` (Priority: P1)

当模型看到当前 session 的 latest snapshot 时，我希望它不只知道“正在做什么”，还知道“这一轮实际查了什么文件 / 命令线索”。这样它更容易把 `Learned / Completed` 和真实 evidence 联系起来。

**为什么这个优先级最高**：这是 `claude-mem` latest summary 仍领先我们的一条具体字段差距，不是新模块，而是 snapshot 解释力不足。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 latest snapshot 在存在稳定 evidence 时新增 `Investigated`。

**验收场景**：

1. **Given** latest summary 覆盖的 observation 带文件 evidence，**When** 生成 system context，**Then** snapshot 中出现 `Investigated: ...`。
2. **Given** latest summary 没有稳定 evidence，**When** 生成 system context，**Then** 不强制显示 `Investigated`。

### 用户故事 2 - compaction snapshot 复用同样的 `Investigated` 字段 (Priority: P2)

当 compaction context 生成 latest snapshot 时，我希望它复用同样的 `Investigated` 字段，而不是 system context 有、compaction snapshot 没有。

**为什么这个优先级排第二**：这不是新增 compaction section，而是保证两边共享的 latest snapshot 字段保持一致。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 latest snapshot 同样会显示 `Investigated`。

**验收场景**：

1. **Given** latest summary 覆盖的 observation 带稳定 evidence，**When** 生成 compaction context，**Then** latest snapshot 也出现 `Investigated: ...`。

## 边界情况

- `Investigated` 只在能从现有 observation evidence 稳定推出来时显示。
- 这轮不引入新的模型调用。
- 这轮不改变 `Current Focus` 现有字段。
- `Investigated` 不应退化成和 `Learned` 一样的句子。

## 需求

### 功能需求

- **FR-001**：latest session snapshot 在有稳定 evidence 线索时必须显示 `Investigated`。
- **FR-002**：`Investigated` 必须优先来自现有 observation trace（文件 / 命令）而不是新数据源。
- **FR-003**：当没有稳定 evidence 线索时，不强制显示 `Investigated`。
- **FR-004**：system context 与 compaction context 的 latest snapshot 字段策略必须保持一致。
- **FR-005**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 tool surface。

### 关键实体

- **Snapshot Investigated**：latest summary snapshot 中的一条字段，用于表达“这一轮实际查了什么”。

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 latest snapshot 在有 evidence 时出现 `Investigated`。
- **SC-002**：compaction context 的 latest snapshot 在同样条件下也出现 `Investigated`。
- **SC-003**：`Investigated` 不会简单重复 `Learned` 文本。
- **SC-004**：这轮不改变 tool surface 和 schema。
