# 功能规格：Token Key Detail Lines

**Feature Branch**: `[041-token-key-detail-lines]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 header 已经会说：

- `[TOKEN KEY]`
- `Read=current reading cost | Work=prior work investment`

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只给短缩写，还会分别解释：
  - `Read` 是现在阅读这一条的成本
  - `Work` 是过去为产出这一条花掉的工作量
- 我们现在仍然是单行压缩版

所以这份规格只解决一个问题：

**把 `[TOKEN KEY]` 从单行压缩说明改成两条更完整的说明，让 token 提示更接近 `claude-mem` 的列说明。**

本轮保持保守：

- 不改 `[TIMELINE KEY]`
- 不改 `[CONTEXT INDEX]`
- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 的 token key 变成两条完整说明 (Priority: P1) 🎯 MVP

当模型读到 `[TOKEN KEY]` 时，我希望它知道：

- `Read` 代表现在读懂这一条大概要花多少 token
- `Work` 代表过去为了产出这一条已经投入了多少工作 token

**为什么这个优先级最高**：这是 `claude-mem` 同位置仍比我们多的一条可见输出差距，不是新能力，只是 token key 解释更完整。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[TOKEN KEY]` 下面出现两条完整说明。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `[TOKEN KEY]` 后应出现两条分别解释 `Read` 和 `Work` 的 bullet。

### 用户故事 2 - compaction context 继续不带这些完整说明 (Priority: P2)

当 compaction context 生成时，我不希望因为 system token key 增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这两条完整说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `cost to read this memory now` 或 `past work tokens already spent`。

## 边界情况

- 说明必须短
- 只出现在 system context
- compaction context 不引入这些说明

## 需求

### 功能需求

- **FR-001**：system context 的 `[TOKEN KEY]` 必须改成两条完整说明
- **FR-002**：`Read` 的说明必须表达“现在读懂这一条的成本”
- **FR-003**：`Work` 的说明必须表达“过去已投入的工作量”
- **FR-004**：compaction context 不得引入这些说明
- **FR-005**：本轮不得修改 `[TIMELINE KEY]`、timeline、footer、schema、worker runtime

### 关键实体

- **TokenKeyDetailLine**：`[TOKEN KEY]` 下的一条完整说明。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[TOKEN KEY]` 后可见两条完整说明
- **SC-002**：compaction context 不出现这些说明
