# 功能规格：Hybrid Memory Search Results

**Feature Branch**: `[065-hybrid-memory-search-results]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 当前 `memory_search` 的语义召回已经接上 `USearch`，但结果编排仍然是“有 semantic 就直接返回 semantic，没有才回退文本检索”。这和 `claude-mem` 在同层的 hybrid search 还有一处明确差距。

## 先做 `claude-mem` 对照

`claude-mem` 在 [HybridSearchStrategy.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/strategies/HybridSearchStrategy.ts) 这一层，解决的不是“有没有向量召回”，而是：

- 先拿到 metadata / SQLite 命中
- 再用语义排序做 relevance ranking
- 最后把两边结果编排进同一个结果面

当前 `opencode-memory` 的 `memory_search` 已经具备：

- semantic session/project query
- text session/project fallback
- summary-first 结果纪律

但现在同一 scope 下还是单路返回：

- 只要 semantic 有结果，就不会再把 text 命中并进结果面
- text 命中的 summary / observation 无法和 semantic 命中一起呈现

所以这份规格只解决一个差距：

**让 `memory_search` 在同一 scope 下合并 semantic 与 text 命中，去重后再按现有 summary-first 纪律返回。**

这轮保持保守：

- 不改 `memory_timeline`
- 不改 `memory_details`
- 不改 context builder
- 不新增用户可见 tool
- 不引入复杂 reranking

## 用户场景与测试

### 用户故事 1 - 同一 scope 下合并 semantic 与 text 结果 (Priority: P1)

作为使用 `memory_search` 的用户，我希望同一个 scope 下的语义命中和文本命中能一起进入结果面，而不是 semantic 一命中就把 text 结果完全吃掉。

**为什么这个优先级最高**：这正是 `claude-mem` 当前同层 hybrid 编排和我们之间最清楚、最可验证的差距。

**独立测试方式**：构造 session semantic 命中 observation、session text 命中 summary，验证返回结果同时包含两者，并保持 summary-first。

**验收场景**：

1. **Given** session semantic 命中 observation、session text 命中 summary，**When** 调用 `memory_search`，**Then** 返回结果必须同时包含这两类记录，且 summary 在前。
2. **Given** session semantic 与 session text 都为空，project semantic 与 project text 有结果，**When** 调用 `memory_search`，**Then** 返回 project scope 的混合结果。

### 用户故事 2 - 混合结果必须去重 (Priority: P1)

作为使用 `memory_search` 的用户，我不希望同一条 summary 或 observation 因为同时被 semantic 和 text 命中而重复出现。

**为什么这个优先级同样高**：一旦开始做 hybrid merge，不去重会直接污染结果面。

**独立测试方式**：构造 semantic 和 text 同时返回同一个 observation 或 summary，验证最终只保留一条。

**验收场景**：

1. **Given** semantic 和 text 都命中同一个 observation，**When** 混合结果生成，**Then** 最终结果里这条 observation 只能出现一次。
2. **Given** semantic 和 text 都命中同一个 summary，**When** 混合结果生成，**Then** 最终结果里这条 summary 只能出现一次。

## 边界情况

- 如果某个 scope 只有 semantic 命中，没有 text 命中，仍返回该 scope 的 semantic 结果
- 如果某个 scope 只有 text 命中，没有 semantic 命中，仍返回该 scope 的 text 结果
- 混合后的结果仍受 `limit` 限制
- 结果去重以 `kind + id` 为准
- 这轮不引入新的排序字段；混合后继续遵守现有 summary-first 结果纪律

## 需求

### 功能需求

- **FR-001**：`memory_search` 在同一 scope 下必须同时收集 semantic 和 text 命中，并合并为一个结果集。
- **FR-002**：混合结果必须按 `kind + id` 去重。
- **FR-003**：混合结果必须保持现有 summary-first 纪律。
- **FR-004**：如果 session scope 已经得到非空混合结果，默认搜索不得继续回退到 project scope。
- **FR-005**：如果 session scope 为空，默认搜索必须继续尝试 project scope 的混合结果。

## 成功标准

### 可衡量结果

- **SC-001**：同一 scope 下，semantic 命中和 text 命中可以同时出现在 `memory_search` 返回结果中。
- **SC-002**：语义和文本双命中的同一条记录，最终只出现一次。
- **SC-003**：现有 session-first / project-fallback 纪律保持不变。
