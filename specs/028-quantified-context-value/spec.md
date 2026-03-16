# 功能规格：Quantified Context Value

**Feature Branch**: `[028-quantified-context-value]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线对齐功能，并继续按 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT VALUE]` 已经会说：

- 这份 index 压缩了多少 covered observations
- 应该先信任当前 index

但和 `claude-mem` 的 footer 对照后，当前最具体的一条剩余差距是：

- `claude-mem` 的 footer 会把“这份 index 值不值”量化成一句话
- 它会明确表达：
  - 用多少读取成本
  - 换回了多少过去工作
- 我们现在还没有这句量化后的收尾判断

所以这份规格只解决一个问题：

**给 `[CONTEXT VALUE]` 增加一条量化后的价值句：把当前 `Work investment / Loading` 收成一句更接近 `claude-mem` footer 的结论。**

这轮保持保守：

- 不改 schema
- 不改 worker runtime
- 不改 `[CONTEXT ECONOMICS]`
- 不改 compaction context

## 用户场景与测试

### 用户故事 1 - system context footer 给出量化后的价值句 (Priority: P1)

当模型读到 `[CONTEXT VALUE]` 时，我希望它不只看到泛化判断，还能看到：

- 当前 index 大概对应多少过去工作
- 当前读取它只要多少成本

这样这份 footer 就更接近 `claude-mem` 的结尾收束方式。

**为什么这个优先级最高**：上一轮已经有 economics 数字，这轮只需要把这些数字收成一条更像 `claude-mem` footer 的自然句子。

**独立测试方式**：调用 `buildSystemMemoryContext()`，构造 summary + observation 输入，验证 `[CONTEXT VALUE]` 中出现量化句。

**验收场景**：

1. **Given** 有 summary 和 observation，**When** 生成 system context，**Then** `[CONTEXT VALUE]` 中应出现 `Access` 开头的量化句。
2. **Given** 同样输入，**When** 生成 system context，**Then** 量化句中应同时出现读取成本和过去工作投入。

### 用户故事 2 - 零 savings 时仍保留泛化 footer (Priority: P2)

当 `Work investment` 没有明显高于 `Loading` 时，我仍希望 `[CONTEXT VALUE]` 至少保留原有泛化判断，不因为量化句不成立而整个 footer 变弱。

**为什么这个优先级排第二**：量化句是增强层，不能反过来让原 footer 在小样本场景里退化。

**独立测试方式**：调用 `buildSystemMemoryContext()`，构造极小 observation 场景，验证仍有原泛化 footer。

## 边界情况

- 量化句只在 `workTokens > 0` 且 `loadingTokens > 0` 时显示。
- 原有泛化 footer 不删除。
- compaction context 继续不显示 `[CONTEXT VALUE]`。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT VALUE]` 必须保留原有泛化 footer。
- **FR-002**：当 economics estimate 可用时，`[CONTEXT VALUE]` 必须新增一条量化句。
- **FR-003**：量化句必须同时引用 `workTokens` 和 `loadingTokens`。
- **FR-004**：这轮不得修改 schema、runtime 或 compaction context。

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 `[CONTEXT VALUE]` 中出现 `Access ... for just ...` 量化句。
- **SC-002**：小样本场景下，原有泛化 footer 仍保留。
- **SC-003**：compaction context 行为不变。
