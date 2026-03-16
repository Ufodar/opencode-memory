# 功能规格：File Grouped Memory Timeline

**Feature Branch**: `[013-file-grouped-memory-timeline]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- timeline checkpoint 有 request 语义
- timeline checkpoint 有 `HH:MM` 时间前缀
- summary 与 observation 已按时间混排
- 跨天时已插入 `[day] YYYY-MM-DD`

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 会在同一天内部继续按文件组织 observation
- 我们现在虽然会在 observation 行尾补 `(files: brief.txt)`，但文件仍然散在时间线里
- 这意味着同一天看多个文件时，不容易一眼看出“这几条 observation 属于哪个文件”

所以这份规格只解决一个问题：

**让 memory timeline 在同一天内部按文件插入分组线，而不是只把文件名塞在 observation 行尾。**

## 用户场景与测试

### 用户故事 1 - system timeline 在同一天内按文件分组 (Priority: P1)

当当前会话查看 `[MEMORY TIMELINE]` 时，如果多条 observation 来自同一个文件，我希望 timeline 先出现 `[file] xxx`，再列出这些 observation。

**为什么这个优先级最高**：这是当前 timeline 和 `claude-mem` 文件组织方式最直接的剩余差距。

**独立测试方式**：构造同一天内来自两个不同文件的 observation，调用 `buildSystemMemoryContext()` 验证 `[file] ...` 分组线。

### 用户故事 2 - compaction timeline 也按文件分组 (Priority: P2)

当 compaction context 渲染 timeline checkpoint 时，我希望它和 system context 使用同一套文件分组规则。

**为什么这个优先级排第二**：system / compaction 必须继续共享同一套 timeline 组织纪律。

## 边界情况

- summary checkpoint 不应被塞进文件分组里。
- 同一文件的连续 observation 不应重复插入 `[file]` 分组线。
- 如果 summary 打断了 observation 流，后续 observation 即使还是同一文件，也应重新显示 `[file]` 分组线。
- 没有文件线索的 observation 不应强行插入空的文件分组线。
- 文件分组不应破坏已有的时间混排和跨天日期分组。

## 需求

### 功能需求

- **FR-001**：system timeline 在 observation 有明确文件线索时必须插入 `[file] 文件名` 分组线。
- **FR-002**：同一文件的连续 observation 不得重复插入分组线。
- **FR-003**：summary checkpoint 不得吸收到文件分组中。
- **FR-004**：compaction timeline 必须复用同一套文件分组规则。

## 成功标准

### 可衡量结果

- **SC-001**：system timeline 能按文件分块阅读同一天内的 observation。
- **SC-002**：compaction timeline 使用同一套文件分组规则。
- **SC-003**：现有的按时间混排和跨天 `[day]` 分组仍然保留。
