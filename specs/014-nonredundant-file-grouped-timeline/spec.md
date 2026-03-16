# 功能规格：Nonredundant File Grouped Timeline

**Feature Branch**: `[014-nonredundant-file-grouped-timeline]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- timeline 已有 `[day] YYYY-MM-DD`
- timeline 已有 `[file] brief.txt`
- summary / observation 已按时间混排

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 在按文件分组后，不会在每条 observation 行里再次重复文件名
- 我们现在已经有：
  - `[file] brief.txt`
- 但 observation 行仍然还会出现：
  - `(files: brief.txt)`

所以这份规格只解决一个问题：

**在已经有 `[file] 文件名` 分组线时，不再在 observation 行尾重复显示同样的 `files:` 提示。**

## 用户场景与测试

### 用户故事 1 - system timeline 的文件分组不再重复文件提示 (Priority: P1)

当 timeline 已经插入 `[file] brief.txt` 时，我希望 observation 行本身不要再重复 `(files: brief.txt)`。

**为什么这个优先级最高**：这是当前 `013` 完成后最直接的可见冗余，和 `claude-mem` 的文件组织方式最接近。

**独立测试方式**：构造有文件分组的 observation，调用 `buildSystemMemoryContext()`，验证 `[file] brief.txt` 保留，但 observation 行不再带 `(files: brief.txt)`。

### 用户故事 2 - compaction timeline 也去掉重复文件提示 (Priority: P2)

当 compaction timeline 已经插入 `[file] brief.txt` 时，我希望 observation 行也不要再重复同样的文件提示。

**为什么这个优先级排第二**：system / compaction 必须继续共享同一套 timeline 组织纪律。

## 边界情况

- 没有文件分组线时，现有 evidence hint 仍应保留。
- `cmd:` 这类非文件提示不应被误删。
- summary checkpoint 不受这一轮影响。
- 跨天 `[day]` 分组与 `[file]` 分组都必须继续保留。

## 需求

### 功能需求

- **FR-001**：当 observation 已被 `[file] 文件名` 分组覆盖时，observation 行不得再重复显示 `files:` hint。
- **FR-002**：没有文件分组的 observation 仍可保留现有非文件 evidence hint。
- **FR-003**：compaction timeline 必须复用同一套去重规则。

## 成功标准

### 可衡量结果

- **SC-001**：system timeline 出现 `[file] brief.txt` 时，不再出现同一文件的 `(files: brief.txt)`。
- **SC-002**：compaction timeline 使用同一套去重规则。
- **SC-003**：现有的 `[day]`、`[file]`、时间混排都不被破坏。
