# 功能规格：Project Header Wording

**Feature Branch**: `[040-project-header-wording]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的头部已经会说：

- `[CONTINUITY]`
- `Scope: current session memory`
- `Project: demo-project | Generated: 2026-03-16 17:14 UTC`

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 在同位置会把这行写成标题式：
  - `# [demo-project] recent context, 2026-03-16 ...`
- 我们现在仍然是标签式：
  - `Project: ... | Generated: ...`

所以这份规格只解决一个问题：

**把 project freshness 这一行从“标签式”改成“标题式 wording”，让头部第一屏更像 `claude-mem` 的 recent context header。**

本轮保持保守：

- 不改 `[CONTINUITY]`
- 不改 section 顺序
- 不改 `[CONTEXT INDEX]`
- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 的 project freshness 行改成标题式 wording (Priority: P1) 🎯 MVP

当模型读到 system context 的头部时，我希望先看到更像 recent context 标题的项目/时间行，而不是 `Project: ... | Generated: ...` 这种标签式输出。

**为什么这个优先级最高**：这是 `claude-mem` 同位置仍比我们多的一条可见输出差距，不是新能力，只是头部 wording 更接近。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 project freshness 行改成标题式 wording。

**验收场景**：

1. **Given** 有 `projectPath` 的 system context，**When** 输出生成，**Then** 应出现 `# [demo-project] recent context, ...`
2. **Given** 没有 `projectPath` 的 system context，**When** 输出生成，**Then** 应出现 `# recent context, ...`

### 用户故事 2 - compaction context 继续不带这条标题式 header (Priority: P2)

当 compaction context 生成时，我不希望因为 system header wording 增强而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现 `recent context,` 这类标题式行。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现 `recent context,`

## 边界情况

- 标题式 wording 必须保留项目名和生成时间
- 没有项目名时仍保留生成时间
- 只出现在 system context
- 不改 section 顺序

## 需求

### 功能需求

- **FR-001**：system context 的 freshness 行必须改成标题式 wording
- **FR-002**：有项目名时，标题式 wording 必须包含项目名和生成时间
- **FR-003**：无项目名时，标题式 wording 仍必须包含生成时间
- **FR-004**：compaction context 不得引入这条标题式 wording
- **FR-005**：本轮不得修改 `[CONTINUITY]`、timeline、footer、schema、worker runtime

### 关键实体

- **ProjectHeaderLine**：system context 头部中包含项目名和生成时间的一行标题式文本。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中可见 `# [project] recent context, ...` 或 `# recent context, ...`
- **SC-002**：project freshness 信息仍然完整保留
- **SC-003**：compaction context 不出现 `recent context,`
