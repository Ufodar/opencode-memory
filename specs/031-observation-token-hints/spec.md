# 功能规格：Observation Token Hints

**Feature Branch**: `[031-observation-token-hints]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 expanded observation 已经会显示：

- `Result`
- `Tool`
- `Evidence`

但和 `claude-mem` 的记录行对照后，当前最真实的一条剩余差距是：

- `claude-mem` 的记录还会给出 `Read / Work` 这类行级 token 线索
- 我们当前只有全局 `[CONTEXT ECONOMICS]`
- 还没有“这条 observation 自己读起来多贵、代表多少过去工作”的局部提示

所以这份规格只解决一个问题：

**为 expanded observation detail 增加一条短的 `Tokens: Read ~X | Work ~Y` 提示，让局部 observation 也能暴露 token 价值。**

这轮保持保守：

- 不改折叠 observation 主行
- 不改 summary
- 不改 retrieval 排序
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - expanded observation 直接给出局部 token hint (Priority: P1)

当 observation 被展开显示时，我希望除了 `Result / Tool / Evidence` 外，还能直接看到这条 observation 自己的 `Read / Work` token hint，而不必只看全局 economics。

**为什么这个优先级最高**：这是 `claude-mem` 在记录层仍领先我们的一层信息。不是更多记录，而是让局部记录的价值更可见。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 expanded observation 下出现 `Tokens: Read ~X | Work ~Y`。

**验收场景**：

1. **Given** system context 中有 expanded observation，**When** timeline 输出生成，**Then** 该 observation detail 必须包含 `Tokens:` 行。
2. **Given** observation 未展开，**When** timeline 输出生成，**Then** 主行仍保持不变，不强行追加 token hint。

### 用户故事 2 - compaction context 继续保持轻量 (Priority: P2)

当 compaction context 生成时，我不希望因为这层 token hint 让压缩 prompt 继续变重。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction expanded observation 不引入 `Tokens:` 行。

**验收场景**：

1. **Given** 构建 compaction context，**When** expanded observation 出现，**Then** 不应新增 `Tokens:` 行。

## 边界情况

- token hint 必须短，不应展开成长说明。
- token hint 必须来自 deterministic estimate，不依赖新模型输出。
- 这轮只作用于 expanded observation detail，不进入折叠行。

## 需求

### 功能需求

- **FR-001**：system context 的 expanded observation detail 必须支持显示 `Tokens: Read ~X | Work ~Y`。
- **FR-002**：该 token hint 必须来自 deterministic estimate。
- **FR-003**：折叠 observation 主行不得引入这条 token hint。
- **FR-004**：compaction context 不得引入这条 token hint。
- **FR-005**：这轮不得修改 schema、worker runtime、retrieval 排序或 summary 渲染。

### 关键实体

- **ObservationTokenHint**：渲染在 expanded observation detail 中的一条短 token hint，用来暴露该 observation 的局部读取成本与工作投入。

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 expanded observation detail 出现 `Tokens: Read ~X | Work ~Y`。
- **SC-002**：折叠 observation 主行不出现这条提示。
- **SC-003**：compaction context 不出现这条提示。
