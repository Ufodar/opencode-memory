# 功能规格：Context Header Instructions

**Feature Branch**: `[019-context-header-instructions]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先对照 `claude-mem`，确认当前 feature 仍然在主线上。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[CONTINUITY]`
- `Scope: ...`
- 一小段 memory index guide
- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`
- `[PREVIOUSLY]`

但和 `claude-mem` 的 header 对照后，当前最真实的剩余差距是：

- `claude-mem` 不只是列出可以用哪些 memory tool
- 它还会明确告诉模型：这份 context index 通常已经够继续工作，只有当缺证据、缺实现细节、缺过去决策理由时，才需要继续下钻

我们现在虽然已经提到：

- `memory_details`
- `memory_timeline`
- `memory_search`

但还没有明确告诉模型：

- **先相信这份索引通常已经够用**
- **只有在哪些情况下才需要继续取更细节**

所以这份规格只解决一个问题：

**在 system context 头部增加一个更完整但仍然很短的 `[CONTEXT INDEX]` 说明，明确“这份 memory index 通常够用”以及“什么时候再去调用更细工具”。**

## 用户场景与测试

### 用户故事 1 - system context 头部先告诉模型这份 index 通常够用 (Priority: P1)

当 system context 被注入给模型时，我希望在开头看到一段更完整的 `[CONTEXT INDEX]` 说明，告诉模型：当前 memory index 通常已经足够继续工作，只有在缺证据、缺实现细节、缺过去决策理由时，才再去调用 memory tools。

**为什么这个优先级最高**：这是 `claude-mem` 当前仍领先我们的一条“如何消费 memory context”的成熟度差距，不是新增数据，而是更好地引导模型使用已有数据。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出在头部包含 `[CONTEXT INDEX]` section，并明确说明“通常足够继续工作”与“何时继续下钻”。

**验收场景**：

1. **Given** 构建 system context，**When** 输出生成，**Then** 头部必须包含 `[CONTEXT INDEX]` section。
2. **Given** `[CONTEXT INDEX]` section 出现，**When** 阅读这段说明，**Then** 必须能看出“通常够用”和“何时下钻”的边界。
3. **Given** 这段说明出现，**When** 阅读 tool guide，**Then** 仍然必须能看出 `memory_details / memory_timeline / memory_search` 的用途。

---

### 用户故事 2 - compaction context 不引入这段 header 说明 (Priority: P2)

当 compaction context 生成时，我不希望把 system 头部的 `[CONTEXT INDEX]` 说明原样带进去，避免压缩 prompt 里混入面向运行时消费的额外 header。

**为什么这个优先级排第二**：这保证新 header 只服务 system context，不污染 compaction prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证输出中不出现 `[CONTEXT INDEX]`。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 `[CONTEXT INDEX]`。

## 边界情况

- 这段 header 必须短，不能把真实 snapshot/timeline 挤掉。
- 这段 header 只出现在 system context，不进入 compaction context。
- 这轮不新增 tool，不改变 retrieval 行为，也不引入 token economics 数字展示。

## 需求

### 功能需求

- **FR-001**：system context 必须在头部包含 `[CONTEXT INDEX]` section。
- **FR-002**：该 section 必须明确说明“当前 memory index 通常已经足够继续工作”。
- **FR-003**：该 section 必须明确说明“只有在缺证据、缺实现细节、缺过去决策理由时才继续下钻”。
- **FR-004**：该 section 必须继续保留 `memory_details / memory_timeline / memory_search` 的用途指引。
- **FR-005**：compaction context 不得复用这段 `[CONTEXT INDEX]` section。
- **FR-006**：这轮不改变 timeline、summary、worker runtime 或数据库 schema。

### 关键实体

- **Context Index Section**：system context 头部的一段短说明，用来告诉模型当前 memory index 的可信边界，以及何时继续调用 memory tools。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现 `[CONTEXT INDEX]` section。
- **SC-002**：该 section 明确表达“通常足够继续工作”。
- **SC-003**：该 section 明确表达“缺证据/缺实现细节/缺过去决策理由时再下钻”。
- **SC-004**：该 section 仍然保留 `memory_details / memory_timeline / memory_search` 的用途指引。
- **SC-005**：compaction context 不出现 `[CONTEXT INDEX]`。
