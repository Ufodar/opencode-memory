# 功能规格：Previously Assistant Handoff Label

**Feature Branch**: `[050-previously-assistant-handoff-label]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[PREVIOUSLY]` section 已经存在：

- 会在有 prior assistant message 时出现
- 会做最小语义压缩
- 不会污染其他 section

但和 `claude-mem` 同位置对照后，当前还剩一处可见表达差距：

- 我们现在只是普通 bullet
- `claude-mem` 会明确把它标成 assistant handoff，使用 `A:` 前缀

所以这份规格只解决一个问题：

**让 `[PREVIOUSLY]` 里的 handoff line 明确带上 `A:` 前缀。**

本轮保持保守：

- 不改 `[PREVIOUSLY]` section 名
- 不改 handoff 文本内容
- 不改 snapshot、timeline、footer
- 不改 compaction context
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 里的 prior assistant handoff 显式标成 `A:` (Priority: P1) 🎯 MVP

当模型读到 `[PREVIOUSLY]` 时，我希望它能一眼看出这是上一条 assistant handoff，而不是普通 bullet。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[PREVIOUSLY]` section 里的文本带 `A:` 前缀。

### 用户故事 2 - 无 handoff 时继续不渲染 `[PREVIOUSLY]` (Priority: P2)

当没有 prior assistant message 时，我不希望为了这轮对齐引入空的 `[PREVIOUSLY]` section。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证没有 prior assistant message 时仍然不出现 `[PREVIOUSLY]`。

## 需求

### 功能需求

- **FR-001**：有 prior assistant handoff 时，`[PREVIOUSLY]` section 的 line 必须带 `A:` 前缀
- **FR-002**：handoff 主体文本不得被本轮顺手改写
- **FR-003**：无 prior assistant handoff 时，`[PREVIOUSLY]` section 仍不得渲染
- **FR-004**：本轮不得修改 snapshot、timeline、footer、schema、worker runtime

### 关键实体

- **PreviouslyAssistantHandoffLine**：`[PREVIOUSLY]` section 中带 `A:` 前缀的上一条 assistant handoff 文本

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[PREVIOUSLY]` line 带 `A:`
- **SC-002**：handoff 文本内容保持原样
- **SC-003**：无 prior assistant handoff 时仍不渲染 `[PREVIOUSLY]`
