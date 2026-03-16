# 功能规格：Multi Expanded Observations

**Feature Branch**: `[017-multi-expanded-observations]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先对照 `claude-mem`，确认 feature 仍然在主线上。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- 最近关键 observation 会展开出 `Result / Tool / Evidence`
- system / compaction 共用同一套展开策略

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 这一层不是只展开最新 1 条 observation
- 它允许展开最近几条关键 observation
- 这样最近一段工作链不会只剩下“最后一步最清楚，前两步又被压回一行”

我们现在虽然已经能告诉模型：

- 最近最新那一步具体做了什么

但还不能告诉模型：

- **最近连续几步关键动作分别做了什么**

所以这份规格只解决一个问题：

**把 observation 展开策略从“只展开 1 条”推进到“展开最近几条关键 observation”。**

## 用户场景与测试

### 用户故事 1 - system context 展开最近几条关键 observation (Priority: P1)

当当前 memory timeline 里存在多条较新的 observation 时，我希望最近几条关键 observation 都能展开，而不是只有最后一条被展开。

**为什么这个优先级最高**：这是当前和 `claude-mem` 的一条真实剩余差距，而且能直接提升最近工作链的恢复质量。

**独立测试方式**：构造三条 observation，调用 `buildSystemMemoryContext()`，验证最近两条会展开 detail lines，而最旧一条保持单行。

**验收场景**：

1. **Given** 最近有三条 observation，**When** 构建 system context，**Then** 最近两条会展开 detail lines，最旧一条保持单行。

---

### 用户故事 2 - compaction context 复用同样的多 observation 展开策略 (Priority: P2)

当 compaction context 生成最近 checkpoint 时，我希望它也展开最近几条关键 observation，而不是仍停留在“只展开 1 条”。

**为什么这个优先级排第二**：这保证普通 context 与 compaction context 在“最近几条 observation 应该展开多少”这一层继续对齐。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证最近两条 observation 会展开 detail lines。

**验收场景**：

1. **Given** compaction timeline 中有三条 observation，**When** 构建 compaction context，**Then** 最近两条会展开 detail lines，最旧一条保持单行。

## 边界情况

- 展开数量仍必须很小，不能重新变成长日志。
- 预算不足时可以提前截断，但默认策略必须不再固定为 1。
- 已经没有更多 detail line 可用的 observation，仍可以只显示主行。

## 需求

### 功能需求

- **FR-001**：system context 必须支持展开最近几条关键 observation，而不是固定 1 条。
- **FR-002**：compaction context 必须复用同样的展开数量策略。
- **FR-003**：较旧 observation 必须继续保持单行。
- **FR-004**：这轮不改变 detail line 的内容类型，只改变“展开几条”的策略。
- **FR-005**：这轮不改变数据库 schema、retrieval 和 summary 生成。

### 关键实体

- **Expanded Observation Window**：context builder 决定“最近几条 observation 允许展开”的窗口。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中最近两条 observation 都能展开 detail lines。
- **SC-002**：compaction context 中最近两条 observation 都能展开 detail lines。
- **SC-003**：第三条及更旧 observation 仍保持单行。
- **SC-004**：现有 snapshot / summary / previously / resume guide 不被破坏。
