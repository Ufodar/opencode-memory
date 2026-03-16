# 功能规格：Timeline Key Detail Lines

**Feature Branch**: `[042-timeline-key-detail-lines]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 header 已经会说：

- `[TIMELINE KEY] [summary]=checkpoint | [research/planning/execution/verification/decision]=phase | {tool}=source tool | [day]=date | [file]=file group`

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 的 legend / column key 都不是一行压缩，而是分开成更容易扫读的多行
- 我们现在的 timeline key 仍然是压缩在一行里

所以这份规格只解决一个问题：

**把 `[TIMELINE KEY]` 从单行压缩说明改成多条更完整的说明，让时间线标签更接近 `claude-mem` 的 legend 可读性。**

本轮保持保守：

- 不改 `[TOKEN KEY]`
- 不改 `[CONTEXT INDEX]`
- 不改 timeline 内容
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 的 timeline key 变成多条完整说明 (Priority: P1) 🎯 MVP

当模型读到 `[TIMELINE KEY]` 时，我希望它能分别看到：

- `[summary]`
- phase 标签
- `{tool}`
- `[day]`
- `[file]`

各自代表什么，而不是读一行很长的压缩说明。

**为什么这个优先级最高**：这是 `claude-mem` 同位置仍比我们多的一条可见输出差距，不是新能力，只是 timeline key 更容易扫读。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[TIMELINE KEY]` 后出现多条完整说明。

**验收场景**：

1. **Given** 正常预算的 system context，**When** 输出生成，**Then** `[TIMELINE KEY]` 后应出现分别解释 summary / phase / tool / day / file 的多条 bullet。

### 用户故事 2 - compaction context 继续不带这些完整说明 (Priority: P2)

当 compaction context 生成时，我不希望因为 system timeline key 增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这些完整说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `summary checkpoint marker` 或 `day grouping line` 这些新 wording。

## 边界情况

- 说明必须短
- 只出现在 system context
- compaction context 不引入这些说明

## 需求

### 功能需求

- **FR-001**：system context 的 `[TIMELINE KEY]` 必须改成多条完整说明
- **FR-002**：说明必须分别覆盖：
  - summary
  - phase
  - tool
  - day
  - file
- **FR-003**：compaction context 不得引入这些说明
- **FR-004**：本轮不得修改 `[TOKEN KEY]`、timeline、footer、schema、worker runtime

### 关键实体

- **TimelineKeyDetailLine**：`[TIMELINE KEY]` 下的一条完整说明。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[TIMELINE KEY]` 后可见多条完整说明
- **SC-002**：compaction context 不出现这些说明
