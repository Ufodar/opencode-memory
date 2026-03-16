# 功能规格：Expanded Key Observations

**Feature Branch**: `[016-expanded-key-observations]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都要先对照 `claude-mem`，确认当前 feature 仍然在主线上。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`
- `[PREVIOUSLY]`
- day/file 分组与去重后的 timeline

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 不会把所有 observation 都压成一行
- 它会对少量关键 observation 直接展开更完整内容
- 这样模型能看到：这条 observation 不是一句标签，而是一段更像“真实工作记录”的内容

我们现在虽然已经能告诉模型：

- 最近做过什么
- 这些 observation 属于哪个 phase
- 主要关联了哪些文件

但还不能告诉模型：

- **最近最重要的一两条 observation 里，到底具体做了什么、得到了什么**

所以这份规格只解决一个问题：

**在 `[MEMORY TIMELINE]` 里，对少量关键 observation 追加多行展开内容，而不是让所有 observation 永远只有一行摘要。**

## 用户场景与测试

### 用户故事 1 - system context 展开最新关键 observation (Priority: P1)

当当前 memory timeline 里存在较新的 observation 时，我希望 system context 能把最关键的 observation 展开成多行，而不是只剩一行压缩摘要。

**为什么这个优先级最高**：这是当前和 `claude-mem` 的一条真实输出差距，直接影响“重新接手工作”时能否看见最近一步到底做了什么。

**独立测试方式**：构造多条 observation，调用 `buildSystemMemoryContext()`，验证 timeline 中最新 observation 以多行形式展开，包含主线和细节，而较旧 observation 仍保持单行。

**验收场景**：

1. **Given** 当前 session 有多条 observation，**When** 构建 system context，**Then** 最新关键 observation 必须以多行形式展开。
2. **Given** 最新 observation 有 phase、tool 或证据信息，**When** 展开它，**Then** 展开内容必须保留这些关键线索，而不是只重复同一行文本。

---

### 用户故事 2 - compaction context 也使用同样的关键 observation 展开策略 (Priority: P2)

当 compaction 需要看到最近 checkpoint 时，我希望 compaction context 也使用同样的关键 observation 展开策略，而不是 system context 和 compaction context 各长各的。

**为什么这个优先级排第二**：这保证 worker 内部对“关键 observation 如何展示”的策略一致，不会出现普通 context 和 compaction context 两套相互漂移的输出。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction timeline 也会展开关键 observation。

**验收场景**：

1. **Given** compaction context 包含 observation timeline，**When** 构建 compaction context，**Then** 最新关键 observation 必须使用和 system context 一致的展开策略。

## 边界情况

- 展开的 observation 数量必须很少，避免 timeline 重新变成长日志。
- 没有更多细节可用时，不应强行展开空字段。
- 已经有 `[file] xxx` 分组头时，不应在 observation 主行里重新塞重复文件提示。
- summary timeline 项不受这轮影响。
- 这轮不改变 SQLite schema，不新增持久化字段。

## 需求

### 功能需求

- **FR-001**：system context 必须对少量关键 observation 追加多行展开内容。
- **FR-002**：展开内容必须优先使用 observation 现有的结构化信息，而不是简单复制主行文本。
- **FR-003**：较旧 observation 仍保持单行 timeline，避免 context 膨胀。
- **FR-004**：compaction context 必须复用同一套关键 observation 展开策略。
- **FR-005**：这轮功能必须只影响 context builder，不改变 retrieval、summary 生成或数据库 schema。

### 关键实体

- **Expanded Observation**：在 timeline 中被选为“关键 observation”的记录，除了主行摘要外，还会追加 1~N 行细节。
- **Observation Detail Line**：从 observation 的现有结构化字段中提炼出的附加信息，用来表达这次工作更具体的动作或结果。

## 成功标准

### 可衡量结果

- **SC-001**：在 system context 中，最新关键 observation 会显示为多行结构。
- **SC-002**：较旧 observation 仍保持单行，不会让 timeline 整体膨胀。
- **SC-003**：compaction context 使用同一套关键 observation 展开策略。
- **SC-004**：现有的 snapshot / summary / previously / resume guide 不被破坏。
