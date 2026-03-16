# 功能规格：Inline Observation Token Hints

**Feature Branch**: `[033-inline-observation-token-hints]`  
**Created**: 2026-03-16  
**Status**: Implemented  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经有：

- expanded observation detail 的 `Tokens: Read ~X | Work ~Y`
- header 中的 `[TOKEN KEY]`

但和 `claude-mem` 的 observation 行对照后，当前最真实的一条剩余差距是：

- `claude-mem` 的 observation 行本身就会给出 `Read / Work`
- 我们当前只有展开后才看得到这条 token hint

所以这份规格只解决一个问题：

**让 system context 中的 observation 主行直接带简短 `Read / Work`，不再必须展开后才能看见。**

这轮保持保守：

- 不改 expanded detail 的 `Tokens:` 行
- 不改 compaction context
- 不改 summary
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - observation 主行直接显示 Read / Work (Priority: P1)

当模型浏览 timeline 时，我希望不展开 observation 也能直接看到这条记录的 `Read / Work`，这样它能更快判断哪些记录值得细看。

**为什么这个优先级最高**：这是 `claude-mem` 在 observation 主行层面仍领先我们的具体输出差距。不是新模块，只是让已有 token 信息更早可见。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 observation 主行出现 `Read ~X | Work ~Y`。

**验收场景**：

1. **Given** system context 中存在 observation timeline 行，**When** 输出生成，**Then** observation 主行必须出现 `Read ~X | Work ~Y`。
2. **Given** observation 已经展开，**When** 输出生成，**Then** 主行和 detail 行都可以各自保留 token 信息。

### 用户故事 2 - compaction context 继续保持轻量 (Priority: P2)

当 compaction context 生成时，我不希望因为这层对齐而让压缩 prompt 每一行都变重。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction observation 主行不出现 inline `Read / Work`。

**验收场景**：

1. **Given** 构建 compaction context，**When** timeline observation 行生成，**Then** 不应出现 inline `Read / Work`。

## 边界情况

- inline token hint 必须短，只保留 `Read ~X | Work ~Y`
- evidence hint、visible ID 仍要保留
- 这轮不新增新的 section

## 需求

### 功能需求

- **FR-001**：system context 的 observation 主行必须支持 inline `Read ~X | Work ~Y`
- **FR-002**：inline token hint 必须来自 deterministic estimate
- **FR-003**：expanded detail 的 `Tokens:` 行继续保留
- **FR-004**：compaction context 不得引入 observation 主行 inline token hint
- **FR-005**：这轮不得修改 schema、worker runtime、summary 渲染或 retrieval 排序

### 关键实体

- **InlineObservationTokenHint**：渲染在 system context observation 主行里的短 token hint，用来暴露该 observation 的局部读取成本与工作投入。

## 成功标准

### 可衡量结果

- **SC-001**：system context observation 主行出现 `Read ~X | Work ~Y`
- **SC-002**：expanded observation detail 的 `Tokens:` 行继续存在
- **SC-003**：compaction context observation 主行不出现 inline `Read / Work`
