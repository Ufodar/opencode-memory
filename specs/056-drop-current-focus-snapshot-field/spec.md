# 功能规格：Drop Current Focus Snapshot Field

**Feature Branch**: `[056-drop-current-focus-snapshot-field]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[LATEST SESSION SNAPSHOT]` 已经有：

- `Current Focus`
- `Investigated`
- `Learned`
- `Completed`
- `Next Steps`

但和 `claude-mem` summary 同位置对照后，当前还剩一处可见差距：

- 我们 snapshot 还多了一行 `Current Focus`
- `claude-mem` 同位置只有 `Investigated / Learned / Completed / Next Steps`

这份规格只解决一个问题：

**把 system context 和 compaction context 里的 `Current Focus` 从 latest snapshot 中去掉。**

本轮保持保守：

- 不改 `Investigated / Learned / Completed / Next Steps`
- 不改 timeline 中 summary 的 `Next:` 子行
- 不改 snapshot 的出现条件
- 不改 footer / context index / token key
- 不改 schema / worker runtime

## 用户场景与测试

### 用户故事 1 - latest snapshot 字段对齐 `claude-mem` (Priority: P1) 🎯 MVP

当模型读到 `[LATEST SESSION SNAPSHOT]` 时，我希望它只显示和 `claude-mem` 同位置一致的字段，而不是多出 `Current Focus`。

**独立测试方式**：调用 `buildSystemMemoryContext()` 和 `buildCompactionMemoryContext()`，验证 snapshot 区块不再包含 `Current Focus:`，并继续保留 `Investigated / Learned / Completed / Next Steps`。

### 用户故事 2 - timeline child line 不受影响 (Priority: P2)

当 snapshot 去掉 `Current Focus` 后，我不希望 timeline summary 下面的 `Next:` 子行被误改。

**独立测试方式**：继续验证 timeline 中 summary child line 仍然是 `Next:`。

## 需求

### 功能需求

- **FR-001**：latest snapshot 不得再渲染 `Current Focus`
- **FR-002**：snapshot 继续保留 `Investigated / Learned / Completed / Next Steps`
- **FR-003**：timeline summary child line 的 `Next:` 不得被本轮改掉
- **FR-004**：本轮不得修改 snapshot 的出现条件、timeline、footer、schema、worker runtime

### 关键实体

- **LatestSessionSnapshotFieldSet**：system context 和 compaction context 中 latest snapshot 的字段集合

## 成功标准

### 可衡量结果

- **SC-001**：system context latest snapshot 不再包含 `Current Focus:`
- **SC-002**：compaction context latest snapshot 不再包含 `Current Focus:`
- **SC-003**：timeline child line 继续保持 `Next:`
