# 功能规格：Memory Index Guide

**Feature Branch**: `[018-memory-index-guide]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先对照 `claude-mem`，确认当前 feature 仍然在主线上。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[CONTINUITY]`
- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`
- `[PREVIOUSLY]`

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 在 context 开头不只是堆数据
- 它还会明确告诉模型：这份 context index 是什么、什么时候够用、什么时候该去取更细节

我们现在虽然已经给了模型：

- memory snapshot
- timeline
- resume guide

但还没有明确告诉模型：

- **这份 memory index 应该怎么用**

所以这份规格只解决一个问题：

**在 system context 开头追加一小段 memory index guide，明确当前索引的用途，以及何时使用 `memory_details / memory_timeline / memory_search`。**

## 用户场景与测试

### 用户故事 1 - system context 先告诉模型这份 memory index 怎么用 (Priority: P1)

当 system context 被注入给模型时，我希望在前面先有一小段 guide，告诉模型：当前 context 是 recent memory index，以及在什么情况下该进一步调用 memory tools。

**为什么这个优先级最高**：这是 `claude-mem` 当前仍领先我们的一条“如何消费 memory”的成熟度差距，不只是“给数据”，而是“告诉模型怎么使用这些数据”。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出在 `[CONTINUITY]` 开头附近包含 memory index guide，并且提到 `memory_details / memory_timeline / memory_search`。

**验收场景**：

1. **Given** 构建 system context，**When** 输出生成，**Then** 开头必须包含一段 memory index guide。
2. **Given** memory index guide 出现，**When** 阅读这段 guide，**Then** 必须能看出三类工具各自用于“细节 / 时间线 / 搜索”。

---

### 用户故事 2 - compaction context 不引入这段 guide (Priority: P2)

当 compaction context 生成时，我不希望把 system guide 原样带进去，避免压缩 prompt 里混入面向运行时消费的额外说明。

**为什么这个优先级排第二**：这保证 guide 只服务 system context 的使用方式，不污染 compaction prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证输出中不出现 `memory_details / memory_timeline / memory_search` 引导说明。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 system 侧的 memory index guide。

## 边界情况

- 这段 guide 必须短，不能反客为主。
- 这段 guide 只出现在 system context，不进入 compaction context。
- 这轮不新增 tool，不改变 retrieval 行为。

## 需求

### 功能需求

- **FR-001**：system context 必须在开头包含简短的 memory index guide。
- **FR-002**：guide 必须明确 `memory_details / memory_timeline / memory_search` 的使用场景。
- **FR-003**：compaction context 不得复用这段 guide。
- **FR-004**：这轮不改变 timeline、summary、worker runtime 或数据库 schema。

### 关键实体

- **Memory Index Guide**：system context 开头的一小段使用说明，用来告诉模型当前 memory snapshot 的性质和继续下钻的工具路径。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现一段简短的 memory index guide。
- **SC-002**：guide 明确提到 `memory_details / memory_timeline / memory_search`。
- **SC-003**：compaction context 不出现这段 guide。
- **SC-004**：现有 `[LATEST SESSION SNAPSHOT] / [MEMORY TIMELINE] / [RESUME GUIDE] / [PREVIOUSLY]` 不被破坏。
