# 功能规格：Context Value Access Phrasing

**Feature Branch**: `[053-context-value-access-phrasing]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT VALUE]` 已经有：

- `This index condenses ...`
- `Access ~... for just ~...`
- `If this index is still not enough ...`

但和 `claude-mem` footer 同位置对照后，当前还剩一处可见 phrasing 差距：

- 我们现在写的是 `tokens of prior work`
- `claude-mem` 同位置会明确说这是 `past research & decisions`

结合当前仓已经在 `[TOKEN KEY]` 中明确过 `research / building / deciding`，这份规格只解决一个问题：

**把 `[CONTEXT VALUE]` 的 access line 从泛化的 `prior work` 改成更明确的 `past research, building, and decisions`。**

本轮保持保守：

- 不改 `[CONTEXT VALUE]` section 名
- 不改 condense line
- 不改 “If this index is still not enough ...” line
- 不改 economics / token key / timeline / snapshot
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - footer 里的 access line 更具体 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT VALUE]` 时，我希望它知道这里节省下来的不是抽象 work，而是 past research / building / decisions。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 access line 包含 `tokens of past research, building, and decisions`。

### 用户故事 2 - 小样本 footer 继续保持 generic 版本 (Priority: P2)

当没有足够 savings 时，我不希望这轮对齐把 generic footer 改坏。

**独立测试方式**：调用 `buildSystemMemoryContext()` 的小样本分支，验证 generic footer 仍然存在。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT VALUE]` access line 必须包含 `tokens of past research, building, and decisions`
- **FR-002**：condense line 不得被本轮顺手改写
- **FR-003**：generic footer 路径不得被回归
- **FR-004**：本轮不得修改 economics、token key、timeline、snapshot、schema、worker runtime

### 关键实体

- **ContextValueAccessLine**：`[CONTEXT VALUE]` 中的 `Access ~...` 那一行

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 access line 包含 `tokens of past research, building, and decisions`
- **SC-002**：generic footer 仍然存在
- **SC-003**：本轮只改变 access line phrasing
