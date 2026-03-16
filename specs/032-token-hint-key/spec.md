# 功能规格：Token Hint Key

**Feature Branch**: `[032-token-hint-key]`  
**Created**: 2026-03-16  
**Status**: Implemented  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经有：

- expanded observation 的 `Tokens: Read ~X | Work ~Y`

但和 `claude-mem` 的 header/column key 对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只显示 `Read / Work`
- 它还会解释这两个词分别代表什么
- 我们现在已经把 token hint 显示出来了，但还没有告诉模型 `Read` / `Work` 的含义

所以这份规格只解决一个问题：

**在 system context header 中增加一条很短的 token key，解释 `Read` 和 `Work` 的含义。**

这轮保持保守：

- 不改 observation 行
- 不改 detail line 内容
- 不改 summary
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - header 解释 Read / Work 的含义 (Priority: P1)

当模型看到 `Tokens: Read ~X | Work ~Y` 时，我希望 header 已经先解释过 `Read` 和 `Work` 的含义，这样它能更稳定地消费这些局部 token hint。

**为什么这个优先级最高**：这是 `claude-mem` 在同层仍领先我们的一条说明文字差距。不是新能力，只是把已有 token hint 说清楚。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 header 中出现 token key，并解释 `Read` / `Work`。

**验收场景**：

1. **Given** system context 输出生成，**When** header 渲染，**Then** 必须出现 token key。
2. **Given** token key 出现，**When** 阅读内容，**Then** 必须能看出：
   - `Read` = 现在读这条记录的成本
   - `Work` = 过去为了得到这条记录投入的工作量

### 用户故事 2 - compaction context 不引入 token key (Priority: P2)

当 compaction context 生成时，我不希望为了 system runtime 的阅读指引而增加新的 token key。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现 token key。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 token key。

## 边界情况

- token key 必须短，不能变成长段说明。
- token key 只出现在 system context header。
- 这轮不改变 existing `Tokens:` 行格式。

## 需求

### 功能需求

- **FR-001**：system context header 必须出现 token key。
- **FR-002**：token key 必须解释 `Read` 与 `Work` 的含义。
- **FR-003**：compaction context 不得引入这条说明。
- **FR-004**：这轮不得修改 schema、worker runtime、retrieval 排序或 context 其他 section 结构。

### 关键实体

- **Token Hint Key**：system context header 中的一条短说明，用来解释 `Read` / `Work` 的语义。

## 成功标准

### 可衡量结果

- **SC-001**：system context header 中出现 token key。
- **SC-002**：阅读 token key 后，能直接理解 `Read` / `Work` 的含义。
- **SC-003**：compaction context 不出现这条说明。
