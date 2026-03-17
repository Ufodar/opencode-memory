# 功能规格：Footer Visible ID Access

**Feature Branch**: `[054-footer-visible-id-access]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT VALUE]` 已经有：

- `This index condenses ...`
- `Access ~... for just ~...`
- `If this index is still not enough ...`

但和 `claude-mem` footer 同位置对照后，当前还剩一处可见差距：

- 我们现在虽然已经写了 `use memory_details with visible IDs`
- 但这句还没有把 **visible IDs 是用来取 detail access** 说得足够直接
- `claude-mem` 同位置更明确地把这件事说成 “access memories by ID”

这份规格只解决一个问题：

**把 `[CONTEXT VALUE]` 的最后一句从泛化的 fallback phrasing，收成更明确的 `visible IDs -> detail access` phrasing。**

本轮保持保守：

- 不改 `[CONTEXT VALUE]` section 名
- 不改 condense line
- 不改 access line
- 不改 economics / token key / timeline / snapshot
- 不改 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - footer 最后一行更明确说明 visible IDs 的用途 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT VALUE]` 的最后一句时，我希望它知道 visible IDs 不是抽象提示，而是拿来调用 `memory_details` 获取更深 detail access 的。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证最后一句包含 `use memory_details with visible IDs to access deeper memory before re-reading history`。

### 用户故事 2 - 量化 access line 不回归 (Priority: P2)

当 footer 最后一行改写后，我不希望前一轮刚对齐好的 `Access ~... tokens of past research, building, and decisions ...` 被顺手改坏。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 access line 仍然保持上一轮 wording。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT VALUE]` 最后一行必须明确 visible IDs 用来获取 deeper memory detail
- **FR-002**：`Access ~... tokens of past research, building, and decisions ...` 不得被本轮顺手改写
- **FR-003**：本轮不得修改 economics、token key、timeline、snapshot、schema、worker runtime

### 关键实体

- **ContextValueDrilldownLine**：`[CONTEXT VALUE]` 中 `If this index is still not enough ...` 那一行

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 footer 最后一行包含 `use memory_details with visible IDs to access deeper memory before re-reading history`
- **SC-002**：上一轮 access line wording 保持不变
- **SC-003**：本轮只改变 footer 最后一行的 phrasing
