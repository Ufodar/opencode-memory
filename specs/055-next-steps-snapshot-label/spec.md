# 功能规格：Next Steps Snapshot Label

**Feature Branch**: `[055-next-steps-snapshot-label]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[LATEST SESSION SNAPSHOT]` 已经有：

- `Current Focus`
- `Investigated`
- `Learned`
- `Completed`
- `Next`

但和 `claude-mem` summary 同位置对照后，当前还剩一处可见差距：

- 我们最后一个字段 label 还是 `Next`
- `claude-mem` 同位置使用的是 `Next Steps`

这份规格只解决一个问题：

**把 snapshot 和 compaction snapshot 中的 `Next` label 改成 `Next Steps`。**

本轮保持保守：

- 不改 snapshot 字段出现条件
- 不改 snapshot 内容
- 不改 `Current Focus / Investigated / Learned / Completed`
- 不改 timeline 中 summary 的 `Next:` 行
- 不改 footer / context index / token key
- 不改 schema / worker runtime

## 用户场景与测试

### 用户故事 1 - snapshot label 对齐 `claude-mem` (Priority: P1) 🎯 MVP

当模型读到 `[LATEST SESSION SNAPSHOT]` 时，我希望最后一个字段 label 和 `claude-mem` 一样是 `Next Steps`，而不是更弱的 `Next`。

**独立测试方式**：调用 `buildSystemMemoryContext()` 和 `buildCompactionMemoryContext()`，验证 snapshot 区块包含 `Next Steps:`。

### 用户故事 2 - timeline 的 `Next:` 行不被误改 (Priority: P2)

当 snapshot label 改成 `Next Steps` 后，我不希望 timeline summary 下面的 `Next:` 子行被顺手一起改掉。

**独立测试方式**：继续验证 timeline 中 summary child line 仍然是 `Next:`。

## 需求

### 功能需求

- **FR-001**：snapshot 字段 label 必须从 `Next` 改成 `Next Steps`
- **FR-002**：timeline summary child line 的 `Next:` 不得被本轮改掉
- **FR-003**：本轮不得修改 snapshot 内容、timeline、footer、schema、worker runtime

### 关键实体

- **SnapshotNextField**：`[LATEST SESSION SNAPSHOT]` 和 compaction snapshot 中最后一个字段

## 成功标准

### 可衡量结果

- **SC-001**：system context snapshot 包含 `Next Steps:`
- **SC-002**：compaction snapshot 包含 `Next Steps:`
- **SC-003**：timeline child line 继续保持 `Next:`
