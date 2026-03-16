# 功能规格：Context Legend

**Feature Branch**: `[020-context-legend]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续按 `claude-mem -> spec-kit -> TDD` 的顺序对齐功能。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system context 里已经会出现这些标签：

- `[summary]`
- `[research] / [planning] / [execution] / [verification] / [decision]`
- `[day]`
- `[file]`

但和 `claude-mem` 的 header 对照后，当前最真实的剩余差距是：

- `claude-mem` 在 header 里有 legend
- 它会先告诉模型这些标签各自代表什么

所以这份规格只解决一个问题：

**在 system context header 中增加一个短的 `[TIMELINE KEY]` section，解释 `[summary]`、phase 标签、`[day]`、`[file]` 的含义。**

## 用户场景与测试

### 用户故事 1 - system context 头部解释 timeline 标签 (Priority: P1)

当 system context 被注入给模型时，我希望在头部看到一个简短的 `[TIMELINE KEY]` section，解释 timeline 中常见标签的意思，这样模型能更稳定地消费这些 checkpoint。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出头部包含 `[TIMELINE KEY]`，并解释 `[summary]`、phase 标签、`[day]`、`[file]`。

**验收场景**：

1. **Given** 构建 system context，**When** 输出生成，**Then** 头部必须包含 `[TIMELINE KEY]`。
2. **Given** `[TIMELINE KEY]` 出现，**When** 阅读内容，**Then** 必须能看出 `[summary]` 是 checkpoint、phase 标签是 observation 阶段、`[day]` 是日期分组、`[file]` 是文件分组。

### 用户故事 2 - compaction context 不引入 legend (Priority: P2)

当 compaction context 生成时，我不希望把 system header 里的 legend 原样带进去，避免压缩 prompt 里出现只服务运行时阅读的额外说明。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证输出中不出现 `[TIMELINE KEY]`。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 `[TIMELINE KEY]`。

## 边界情况

- legend 必须短，不能把最新 snapshot/timeline 挤掉。
- legend 只出现在 system context，不进入 compaction context。
- 这轮不改变 timeline 数据、不新增 tag 类型、不改数据库 schema。

## 需求

### 功能需求

- **FR-001**：system context 必须包含 `[TIMELINE KEY]` section。
- **FR-002**：该 section 必须解释 `[summary]`、phase 标签、`[day]`、`[file]` 的含义。
- **FR-003**：compaction context 不得复用这段 legend。
- **FR-004**：这轮不改变 timeline、summary、worker runtime 或数据库 schema。

### 关键实体

- **Timeline Key Section**：system context header 中的一小段 legend，用来解释 timeline 标签语义。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现 `[TIMELINE KEY]`。
- **SC-002**：该 section 清楚解释 `[summary]`、phase、`[day]`、`[file]`。
- **SC-003**：compaction context 不出现 `[TIMELINE KEY]`。
