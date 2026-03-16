# 功能规格：Project Freshness Header

**Feature Branch**: `[022-project-freshness-header]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system context 头部已经有：

- `[CONTINUITY]`
- `Scope: ...`
- `[CONTEXT INDEX]`
- `[TIMELINE KEY]`
- `[CONTEXT ECONOMICS]`

但和 `claude-mem` 的 header 对照后，当前最真实的一条剩余差距是：

- `claude-mem` 会先告诉模型：这份 recent context 属于哪个项目，以及它是什么时候生成的
- 我们当前只有“这是 memory context”的抽象提示，还没有“项目名 + 新鲜度”这层信息

所以这份规格只解决一个问题：

**在 system context 头部增加一行简短的 project freshness header，明确当前 context 属于哪个项目，以及它是在什么时候生成的。**

这轮保持保守：

- 不修改 compaction context
- 不修改 timeline / retrieval
- 不新增数据库字段
- 不改变 worker runtime

## 用户场景与测试

### 用户故事 1 - system context 头部显示项目名和生成时间 (Priority: P1)

当 system context 被注入给模型时，我希望在开头看到这份 memory context 属于哪个项目，以及它是什么时候生成的。这样模型能更容易判断这份 context 的归属和新鲜度。

**为什么这个优先级最高**：这是 `claude-mem` header 当前仍领先我们的一条真实差距，不是新增 memory 数据，而是更明确地标出 context 的归属和时间语义。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出中包含项目名和生成时间行。

**验收场景**：

1. **Given** system context 拿到来自同一项目的 summaries / observations，**When** 输出生成，**Then** 头部必须显示项目名。
2. **Given** system context 被生成，**When** 输出生成，**Then** 头部必须显示 `Generated:` 时间标记。
3. **Given** 没有可用 projectPath，**When** 输出生成，**Then** 头部仍必须稳定工作，不抛异常。

---

### 用户故事 2 - compaction context 不引入 freshness header (Priority: P2)

当 compaction context 生成时，我不希望把 system header 的 project freshness 信息原样带进去，避免压缩 prompt 里增加只对运行时消费有用的 header。

**为什么这个优先级排第二**：这保证 project/freshness 只服务 system context，不污染 compaction prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证输出中不包含 `Generated:` 行，也不包含 system-style project header。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 `Generated:`。

## 边界情况

- 项目名应优先从 summary / observation 的 `projectPath` 推出，取 basename。
- 生成时间应使用当前本地生成时间，不依赖数据库时间。
- 这段 header 必须短，不能挤压已有 snapshot / timeline。
- 没有 `projectPath` 时允许只显示 `Generated:`。

## 需求

### 功能需求

- **FR-001**：system context 必须在头部显示当前 context 所属项目名（若可推断）。
- **FR-002**：system context 必须在头部显示 `Generated:` 时间。
- **FR-003**：项目名必须从当前 injected records 的 `projectPath` 派生，而不是外部硬编码。
- **FR-004**：没有可用项目名时，system context 仍必须稳定输出。
- **FR-005**：compaction context 不得复用 project freshness header。
- **FR-006**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 timeline 结构。

### 关键实体

- **Project Freshness Header**：system context 头部的一行短说明，用于告诉模型当前 context 属于哪个项目，以及它的生成时间。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现项目名（当 `projectPath` 可推断时）。
- **SC-002**：system context 中出现 `Generated:` 时间标记。
- **SC-003**：没有 `projectPath` 时，system context 仍可正常生成。
- **SC-004**：compaction context 不出现 `Generated:`。
- **SC-005**：这轮不改变 timeline / retrieval / schema / worker runtime。
