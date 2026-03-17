# 功能规格：Memory Search Phase Filter

**Feature Branch**: `[067-memory-search-phase-filter]`  
**Created**: 2026-03-17  
**Status**: Implemented  
**Input**: 当前 `memory_search` 已支持 `kind` 过滤，但还不能显式只查某个工作阶段。对照 `claude-mem` 的 observation metadata filter，这一层最自然的下一步是让已有的 `phase` 真正可检索。

## 先做 `claude-mem` 对照

`claude-mem` 的搜索类型定义已经允许 observation metadata filter：

- `obsType`
- `concepts`
- `files`

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts)

对照当前 `opencode-memory`：

- observation 已经有 `phase`
  - `planning`
  - `research`
  - `execution`
  - `verification`
  - `decision`
  - `other`
- 但 `memory_search` 还不能显式只查某个 phase

所以这份规格只解决一个差距：

**让 `memory_search` 支持 `phase` 过滤，并让 text / semantic 两条路径都遵守它。**

这轮保持保守：

- 只改 `memory_search`
- 不改 `memory_timeline`
- 不改 `memory_details`
- 不引入 `tool/file/concept` 过滤

## 用户场景与测试

### 用户故事 1 - 只查某个 phase 的 observation (Priority: P1)

作为使用 `memory_search` 的用户，我希望能显式只查某个工作阶段，比如只看 `decision` 或 `verification`，这样可以快速回顾这类轨迹。

**为什么这个优先级最高**：我们已经有 phase 数据，不把它变成可检索能力，就是未兑现的搜索元数据。

**独立测试方式**：构造多个 phase 的 observation，并加入 summary，调用 `memory_search(phase=\"decision\")`，验证只返回 `decision` observation。

**验收场景**：

1. **Given** semantic 和 text 都命中多个 phase 的 observation，**When** 使用 `phase=decision` 搜索，**Then** 只返回 `decision` observation。
2. **Given** 同时存在 summary 命中，**When** 使用任意 `phase` 搜索，**Then** summary 不应进入结果面。

## 边界情况

- `phase` 过滤只对 observation 生效
- 一旦指定 `phase`，结果面默认变成 observation-only
- `phase` 过滤必须同时作用于：
  - semantic retrieval
  - text retrieval
  - worker 最终合并守门
- 未指定 `phase` 时，现有行为不变

## 需求

### 功能需求

- **FR-001**：`memory_search` tool 必须支持可选 `phase` 参数，允许值为现有 observation phases。
- **FR-002**：指定 `phase` 时，semantic 与 text 两条路径都必须只返回匹配 phase 的 observation。
- **FR-003**：指定 `phase` 时，summary 不得进入结果面。
- **FR-004**：未指定 `phase` 时，当前行为不得变化。

## 成功标准

### 可衡量结果

- **SC-001**：`memory_search(phase=\"decision\")` 时，结果面只包含 `decision` observation。
- **SC-002**：`memory_search(phase=\"verification\")` 时，结果面只包含 `verification` observation。
- **SC-003**：不指定 `phase` 时，当前 hybrid merge 行为保持不变。
