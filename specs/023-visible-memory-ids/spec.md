# 功能规格：Visible Memory IDs

**Feature Branch**: `[023-visible-memory-ids]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system context 已经有：

- project freshness header
- `[CONTEXT INDEX]`
- `[TIMELINE KEY]`
- `[CONTEXT ECONOMICS]`
- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`

但和 `claude-mem` 的 timeline/header 对照后，当前最真实的一条剩余差距是：

- `claude-mem` 会直接把可见 observation / summary 的 record ID 展示出来
- 然后 header 里的 “Fetch by ID” 才真正对模型有用
- 我们现在虽然有 `memory_details(ids)`，但 context 里并没有把这些 ID 暴露给模型

所以这份规格只解决一个问题：

**让 system context 的 timeline 与 snapshot 显示可见 summary / observation 的 ID，使 `memory_details` 真正能顺着 context 里的内容继续下钻。**

这轮保持保守：

- 不新增工具
- 不改变 retrieval 结果
- 不改数据库 schema
- 不改 compaction 的主结构

## 用户场景与测试

### 用户故事 1 - system context 直接暴露可见 record ID (Priority: P1)

当模型阅读 system context 时，我希望它能直接看到当前可见 summary 和 observation 的 ID。这样如果它需要细节，就能顺着这些 ID 去调用 `memory_details`，而不是只看到内容却不知道该查谁。

**为什么这个优先级最高**：这是 `claude-mem` 当前仍领先我们的一条 retrieval 可用性差距。不是新增数据，而是让已经存在的 `memory_details` 真正和 context 接起来。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 snapshot / timeline 中出现 summary 和 observation 的 ID。

**验收场景**：

1. **Given** system context 中有 summary，**When** 输出生成，**Then** snapshot 或 timeline 必须显示 summary 的 ID。
2. **Given** system context 中有 observation，**When** 输出生成，**Then** observation line 必须显示 observation 的 ID。
3. **Given** context index 中提到 `memory_details`，**When** 可见 ID 已出现，**Then** 这条指引就有了直接可执行的落点。

---

### 用户故事 2 - compaction context 不必强制暴露 ID (Priority: P2)

当 compaction context 生成时，我不要求把这些 ID 一并塞进去，避免为了下钻能力而让 compaction prompt 变得更重。

**为什么这个优先级排第二**：system context 是运行时索引，compaction context 是压缩守护，两者不需要完全一致。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证当前 compaction 输出不要求新增 ID 可见性。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不要求新增 summary / observation ID 的显示。

## 边界情况

- ID 必须短而稳定，不应把 line 撑得过长。
- 最新 snapshot 与 timeline 都可显示 ID，但不能重复得过于噪声。
- 这轮不要求 `memory_search` 结果格式变化。
- 这轮不要求 compaction 跟 system context 保持完全一致。

## 需求

### 功能需求

- **FR-001**：system context 中可见的 summary 必须显示其 ID。
- **FR-002**：system context 中可见的 observation 必须显示其 ID。
- **FR-003**：`[CONTEXT INDEX]` 中对 `memory_details` 的引导必须和这些可见 ID 对上。
- **FR-004**：compaction context 这轮不强制引入同样的 ID 显示。
- **FR-005**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 tool surface。

### 关键实体

- **Visible Memory ID**：system context 中显式显示出来的 summary / observation ID，用于把当前可见 index 和 `memory_details` 下钻能力连接起来。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中可见的 summary 带 ID。
- **SC-002**：system context 中可见的 observation 带 ID。
- **SC-003**：阅读当前 context 后，模型可以直接拿可见 ID 去调用 `memory_details`。
- **SC-004**：这轮不改变 tool surface 和 schema。
