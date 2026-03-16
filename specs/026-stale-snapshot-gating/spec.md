# 功能规格：Stale Snapshot Gating

**Feature Branch**: `[026-stale-snapshot-gating]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线对齐功能，并继续按 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[LATEST SESSION SNAPSHOT]` 只要有 latest summary 就会出现。  
但和 `claude-mem` 的 `SummaryRenderer.shouldShowSummary()` 对照后，当前最具体的一条剩余差距是：

- `claude-mem` 不会在 summary 比 direct observation 更旧时继续展示 latest summary
- 也就是说，如果已经有更新的 observation，旧 summary 不能再冒充“当前状态”
- 我们现在还没有这条 freshness gating

所以这份规格只解决一个问题：

**当 direct observation 比 latest summary 更新时，不再渲染 `[LATEST SESSION SNAPSHOT]`；让旧 summary 回到 timeline。**

这轮保持保守：

- 不改数据库 schema
- 不改 worker runtime
- 不改 retrieval 排序
- 不改 summary 内容本身

## 用户场景与测试

### 用户故事 1 - system context 不显示 stale snapshot (Priority: P1)

当最新 observation 比最新 summary 更新时，我希望 system context 不再把这个旧 summary 放进 `[LATEST SESSION SNAPSHOT]`。这样模型不会把旧 checkpoint 误当成当前状态。

**为什么这个优先级最高**：这是 `claude-mem` 已经有而我们还缺的一条具体 freshness 保护，不是新模块，而是现有 snapshot 的显示条件需要收紧。

**独立测试方式**：调用 `buildSystemMemoryContext()`，构造“summary 更旧、observation 更新”的输入，验证 snapshot 消失且 summary 回到 timeline。

**验收场景**：

1. **Given** latest summary 比 direct observation 更旧，**When** 生成 system context，**Then** 不出现 `[LATEST SESSION SNAPSHOT]`。
2. **Given** 同样输入，**When** 生成 system context，**Then** 旧 summary 仍然保留在 timeline 里。

### 用户故事 2 - compaction context 复用同样的 freshness gating (Priority: P2)

当 compaction context 生成时，我也希望它遵守同样的 freshness 规则，而不是 system context 不显示、compaction 还显示 stale snapshot。

**为什么这个优先级排第二**：latest snapshot 现在是 system / compaction 共用的一层语义，gating 也应保持一致。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 stale summary 时不再显示 latest snapshot。

**验收场景**：

1. **Given** latest summary 比 direct observation 更旧，**When** 生成 compaction context，**Then** 不出现 `Latest session snapshot:`。

## 边界情况

- 只有当 direct observation 的时间严格更新时才隐藏 snapshot。
- 没有 direct observation 时，latest snapshot 仍正常显示。
- 这轮不改变 summary 在 timeline 的文本格式。
- 这轮不影响 `[PREVIOUSLY]`、`[CONTEXT VALUE]` 等其他 section。

## 需求

### 功能需求

- **FR-001**：当最新 direct observation 比 latest summary 更新时，system context 不得渲染 `[LATEST SESSION SNAPSHOT]`。
- **FR-002**：在上述情况下，latest summary 必须继续保留在 timeline 中，而不是被丢失。
- **FR-003**：compaction context 必须复用同样的 freshness gating。
- **FR-004**：当没有更晚的 direct observation 时，latest snapshot 继续正常显示。
- **FR-005**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 tool surface。

### 关键实体

- **Stale Snapshot**：比当前 direct observation 更旧、已不应代表“当前状态”的 latest summary snapshot。

## 成功标准

### 可衡量结果

- **SC-001**：system context 在 stale summary 场景下不再显示 `[LATEST SESSION SNAPSHOT]`。
- **SC-002**：该 stale summary 仍出现在 timeline 中。
- **SC-003**：compaction context 同样不显示 stale latest snapshot。
- **SC-004**：没有 direct observation 更晚时，latest snapshot 行为保持不变。
