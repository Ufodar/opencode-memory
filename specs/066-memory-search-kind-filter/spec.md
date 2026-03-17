# 功能规格：Memory Search Kind Filter

**Feature Branch**: `[066-memory-search-kind-filter]`  
**Created**: 2026-03-17  
**Status**: Implemented  
**Input**: 当前 `memory_search` 已具备 hybrid semantic/text 结果编排，但还不能显式只查 `summary` 或只查 `observation`。对照 `claude-mem`，同层差距已经更接近 search type filter，而不是继续补文案。

## 先做 `claude-mem` 对照

`claude-mem` 在搜索类型定义里已有：

- `searchType`
- `obsType`
- `concepts`
- `files`

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts)

对照当前 `opencode-memory`：

- `memory_search` 已经能做：
  - session-first / project-fallback
  - semantic + text hybrid merge
  - summary-first
- 但用户还不能显式表达：
  - “只看 summary”
  - “只看 observation”

所以这份规格只解决一个差距：

**让 `memory_search` 支持显式 `kind` 过滤，并让 text / semantic 两条路径都遵守这个过滤。**

这轮保持保守：

- 只改 `memory_search`
- 不改 `memory_timeline`
- 不改 `memory_details`
- 不引入 `phase/tool/file/concept` 等更大过滤面

## 用户场景与测试

### 用户故事 1 - 只查 summary (Priority: P1)

作为使用 `memory_search` 的用户，我希望能显式只查 summary，这样我可以快速看阶段结论，而不是被 observation 混入。

**为什么这个优先级最高**：这是 `claude-mem` search type 同层能力里最容易落地、且对当前 tool surface 最自然的扩展。

**独立测试方式**：构造 summary + observation 混合命中，调用 `memory_search(kind=\"summary\")`，验证只返回 summary。

**验收场景**：

1. **Given** semantic 和 text 都命中 summary 与 observation，**When** 使用 `kind=summary` 搜索，**Then** 结果里只能保留 summary。

### 用户故事 2 - 只查 observation (Priority: P1)

作为使用 `memory_search` 的用户，我希望能显式只查 observation，这样我可以直接看细颗粒工作轨迹，而不是先看到 summary。

**为什么这个优先级同样高**：这是 `kind` 过滤的对称能力，必须和 summary filter 一起成立。

**独立测试方式**：构造 summary + observation 混合命中，调用 `memory_search(kind=\"observation\")`，验证只返回 observation。

**验收场景**：

1. **Given** semantic 和 text 都命中 summary 与 observation，**When** 使用 `kind=observation` 搜索，**Then** 结果里只能保留 observation。

## 边界情况

- 未指定 `kind` 时，行为保持不变，仍返回 summary + observation 的混合结果
- `kind` 过滤必须同时作用于：
  - semantic path
  - text path
- `kind` 过滤不得破坏现有：
  - session-first / project-fallback
  - semantic + text merge
  - `kind + id` 去重

## 需求

### 功能需求

- **FR-001**：`memory_search` tool 必须支持可选 `kind` 参数，允许值为 `summary` 或 `observation`。
- **FR-002**：`kind` 过滤必须同时作用于 semantic retrieval 和 text retrieval。
- **FR-003**：未指定 `kind` 时，当前 `memory_search` 行为不得变化。
- **FR-004**：`kind` 过滤不得破坏现有 summary-first / session-first / project-fallback 行为。

## 成功标准

### 可衡量结果

- **SC-001**：`memory_search(kind=\"summary\")` 时，结果面只包含 summary。
- **SC-002**：`memory_search(kind=\"observation\")` 时，结果面只包含 observation。
- **SC-003**：不指定 `kind` 时，原有 hybrid merge 行为保持不变。
