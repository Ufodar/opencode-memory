# 功能规格：Day Grouped Memory Timeline

**Feature Branch**: `[012-day-grouped-memory-timeline]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- timeline checkpoint 有 request 语义
- timeline checkpoint 有短时间前缀
- summary 与 observation 已按时间混排

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 的 timeline 会按天分组
- 我们现在跨天时仍然只看到一串 `HH:MM`
- 这意味着跨两天以上的 checkpoint 不容易一眼看出日期边界

所以这份规格只解决一个问题：

**让 memory timeline 在跨天时插入日期分组行，而不是只有连续的时间点。**

## 用户场景与测试

### 用户故事 1 - system timeline 在跨天时应显示日期分组 (Priority: P1)

当当前会话查看 `[MEMORY TIMELINE]` 时，如果 checkpoint 跨了多天，我希望 timeline 能插入日期分组行，这样一眼就知道哪些工作属于哪一天。

**为什么这个优先级最高**：这是当前 timeline 和 `claude-mem` 时间线组织方式最直接的剩余差距。

**独立测试方式**：构造跨两天的 summary / observation，调用 `buildSystemMemoryContext()` 验证日期分组行。

### 用户故事 2 - compaction timeline 也应显示日期分组 (Priority: P2)

当 compaction context 渲染 timeline checkpoint 时，我希望它和 system context 使用同样的日期分组规则。

**为什么这个优先级排第二**：system / compaction 必须继续共享同一套 timeline 组织纪律。

## 边界情况

- 单天 timeline 不需要额外日期分组行。
- 只有跨天时才插入日期分组。
- 日期分组不应破坏 `011` 的时间混排。
- 日期分组应短、deterministic、兼容 budget。

## 需求

### 功能需求

- **FR-001**：system timeline 在跨天时必须插入日期分组行。
- **FR-002**：日期分组行必须出现在该天第一个 checkpoint 之前。
- **FR-003**：compaction timeline 必须复用同一套日期分组规则。
- **FR-004**：单天 timeline 不应增加无意义的额外分组行。

## 成功标准

### 可衡量结果

- **SC-001**：跨天 system timeline 能直接看出日期边界。
- **SC-002**：跨天 compaction timeline 使用同样的日期分组。
- **SC-003**：`011` 的时间混排仍然保留。
