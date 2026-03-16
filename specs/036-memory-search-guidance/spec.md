# 功能规格：Memory Search Guidance

**Feature Branch**: `[036-memory-search-guidance]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格沿 `claude-mem` 主线对齐，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `[CONTEXT INDEX]` 已经会说：

- 这是 recent working index
- 覆盖 summaries / phases / tools / files / tokens
- 通常已经足够继续工作
- 默认先信这份 index，再决定是否回读代码或历史

但和 `claude-mem` 同位置说明对照后，当前最真实的一条剩余差距是：

- `claude-mem` 不只列出搜索入口
- 它还会明确说 search 主要用来查：
  - past decisions
  - bugs
  - deeper research

所以这份规格只解决一个问题：

**让 `[CONTEXT INDEX]` 里对 `memory_search` 的说明，从抽象的 “broader lookup” 变成更具体的“查过去决策、bug、深层研究”。**

本轮保持保守：

- 不改 timeline
- 不改 footer
- 不改 compaction context
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - context index 更明确说明 `memory_search` 的用途 (Priority: P1) 🎯 MVP

当模型读到 `[CONTEXT INDEX]` 时，我希望它不只是知道 `memory_search` 是“更广的查询”，还知道它主要适用于查过去决策、bug 和更深的研究背景。

**为什么这个优先级最高**：这是 `claude-mem` 在同一个工具说明行上仍领先我们的一条可见输出，不是新能力，只是把现有工具用途说得更具体。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[CONTEXT INDEX]` 中出现更具体的 `memory_search` 用途说明。

**验收场景**：

1. **Given** system context header 渲染，**When** 输出生成，**Then** 必须出现 `memory_search` 用于 past decisions / bugs / deeper research 的说明。

### 用户故事 2 - compaction context 继续不带这条说明 (Priority: P2)

当 compaction context 生成时，我不希望为了 system header 的工具说明而加长压缩 prompt。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 不出现这条 `memory_search` 用途说明。

**验收场景**：

1. **Given** compaction context 生成，**When** 输出生成，**Then** 不应出现关于 `memory_search` 具体用途的说明。

## 边界情况

- 说明必须短，不扩成新的小节
- 说明只出现在 system context
- 这轮只改 `memory_search` 这一项，不顺手改 `memory_details` / `memory_timeline`

## 需求

### 功能需求

- **FR-001**：system context header 必须将 `memory_search` 的用途说明从泛化的 “broader lookup” 收紧为更具体的 past decisions / bugs / deeper research
- **FR-002**：这条说明必须仍然与 `memory_details` / `memory_timeline` 同处 `[CONTEXT INDEX]` 指南中
- **FR-003**：compaction context 不得引入这条说明
- **FR-004**：这轮不得修改 timeline、footer、schema、worker runtime

### 关键实体

- **MemorySearchGuidanceLine**：`[CONTEXT INDEX]` section 中描述 `memory_search` 适用场景的一条短说明。

## 成功标准

### 可衡量结果

- **SC-001**：system context header 中可见 `memory_search` 对应 past decisions / bugs / deeper research 的说明
- **SC-002**：原有 `memory_details` / `memory_timeline` 指南仍保留
- **SC-003**：compaction context 不出现这条新说明
