# 功能规格：Context Index Trust Guidance

**Feature Branch**: `[035-context-index-trust-guidance]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经会说：

- 这是 recent working index
- 这份 index 覆盖 summaries / phases / tools / files / tokens
- 当前 index 通常已经足够继续工作

但和 `claude-mem` 的同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只说“够不够”
- 它还会明确给出一个使用原则：
  - 先信这份 index
  - 再决定是否回去重读代码或历史

所以这份规格只解决一个问题：

**让 `[CONTEXT INDEX]` 再补一句短的 trust guidance，明确先用这份 index，再决定是否回读历史。**

这轮保持保守：

- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - context index 明确提示先信当前 index (Priority: P1)

当模型读到 `[CONTEXT INDEX]` 时，我希望它不只是知道 index 覆盖了什么，还知道当前默认策略应该是先使用这份 index，而不是立刻回头重读历史。

**为什么这个优先级最高**：这是 `claude-mem` 在 header 同位置仍领先我们的一条使用原则，不是新能力，只是把消费方式说得更清楚。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 header 中出现一条 trust guidance。

**验收场景**：

1. **Given** system context header 渲染，**When** 输出生成，**Then** 必须出现一条“先信 index，再决定是否回读历史/代码”的说明。

### 用户故事 2 - compaction context 继续不带这条说明 (Priority: P2)

当 compaction context 生成时，我不希望为了 header 使用原则而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这条 trust guidance。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 trust guidance。

## 边界情况

- 说明必须短，不变成长段导读
- 说明只出现在 system context
- 这轮不改已有下钻说明

## 需求

### 功能需求

- **FR-001**：system context header 必须新增一条 trust guidance
- **FR-002**：这条说明必须表达“先使用 index，再决定是否回读历史/代码”
- **FR-003**：compaction context 不得引入这条说明
- **FR-004**：这轮不得修改 timeline、footer、schema、worker runtime

### 关键实体

- **ContextIndexTrustLine**：`[CONTEXT INDEX]` section 中的一条短说明，用来表达“先使用 index，再决定是否回读历史”的默认策略。

## 成功标准

### 可衡量结果

- **SC-001**：system context header 出现 trust guidance
- **SC-002**：说明中可见“trust index / re-read history”这类语义
- **SC-003**：compaction context 不出现这条说明
