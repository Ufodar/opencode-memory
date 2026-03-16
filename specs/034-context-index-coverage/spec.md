# 功能规格：Context Index Coverage

**Feature Branch**: `[034-context-index-coverage]`  
**Created**: 2026-03-16  
**Status**: Implemented  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经会说：

- `This memory snapshot is a recent working index.`

但和 `claude-mem` 的同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只说“这是 index”
- 它还会明确说这份 index 包含哪些信息
- 我们当前没有告诉模型这份 index 里实际覆盖了什么

所以这份规格只解决一个问题：

**让 `[CONTEXT INDEX]` 明确说明这份 index 覆盖 summaries / phases / tools / files / tokens。**

这轮保持保守：

- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - context index 明确说出自己覆盖的信息 (Priority: P1)

当模型读到 `[CONTEXT INDEX]` 时，我希望它不仅知道“这是 memory index”，还知道这份 index 实际覆盖了 summaries、phases、tools、files、tokens 这些工作线索。

**为什么这个优先级最高**：这是 `claude-mem` 在 header 同位置仍领先我们的一条具体解释，不是新能力，只是把这份 index 说得更清楚。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 header 中出现关于 summaries / phases / tools / files / tokens 的说明。

**验收场景**：

1. **Given** system context header 渲染，**When** 输出生成，**Then** 必须出现一条说明 index 覆盖 summaries / phases / tools / files / tokens。

### 用户故事 2 - compaction context 继续不带这条说明 (Priority: P2)

当 compaction context 生成时，我不希望为了 header 解释而继续加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这条 coverage 说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 coverage 说明。

## 边界情况

- 说明必须短，不变成长段导读
- 说明只出现在 system context
- 这轮不改已有下钻说明

## 需求

### 功能需求

- **FR-001**：system context header 必须明确说明 index 覆盖 summaries / phases / tools / files / tokens
- **FR-002**：这条说明必须简短
- **FR-003**：compaction context 不得引入这条说明
- **FR-004**：这轮不得修改 timeline、footer、schema、worker runtime

### 关键实体

- **ContextIndexCoverageLine**：`[CONTEXT INDEX]` section 中的一条短说明，用来解释这份 index 覆盖哪些信息类型。

## 成功标准

### 可衡量结果

- **SC-001**：system context header 出现覆盖范围说明
- **SC-002**：说明中可见 summaries / phases / tools / files / tokens 这些关键词
- **SC-003**：compaction context 不出现这条说明
