# 功能规格：Vector Memory Search

**Feature Branch**: `[061-vector-memory-search]`  
**Created**: 2026-03-17  
**Status**: Completed  
**Input**: 用户要求在准备开源前推进向量化第一刀，并使用本地可连接的 Qwen embedding 模型做真实测试。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 `memory_search` 仍然主要依赖：

- SQLite
- `LIKE` 文本匹配
- summary-first 排序与去重

而 `claude-mem` 在同一层已经具备：

- 向量语义召回
- 结构化过滤与 hydration
- hybrid search

所以这份规格只解决一个最小差距：

**给 `memory_search` 增加第一版语义召回能力，优先走 embedding API + 本地 vector index，并保留当前 SQLite 文本检索作为回退。**

这轮保持保守：

- 不改 `memory_timeline`
- 不改 `memory_details`
- 不做 providerRef
- 不上 Chroma
- 只做 `memory_search` 的最小垂直切片

## 用户场景与测试

### 用户故事 1 - `memory_search` 能召回语义相近但不字面匹配的记录 (Priority: P1)

作为使用 `memory_search` 的 agent，我希望当 query 与 observation / summary 语义相近、但没有明显字面重合时，系统仍然能找回相关 memory，而不是只能靠 `LIKE` 命中。

**为什么这个优先级最高**：这是当前 `opencode-memory` 与 `claude-mem` 在 search 层最直接的功能差距，也是向量化第一刀最有价值的地方。

**独立测试方式**：写入一条 observation，其内容与 query 语义相近但没有关键字重合；开启 embedding 配置后调用 `memory_search`，验证该 observation 能被返回。

**验收场景**：

1. **Given** 已有一条 observation 表达“修复 worker 端口冲突”，**When** 查询“解决启动监听占用问题”，**Then** `memory_search` 应能返回该 observation，即使没有直接字面匹配。
2. **Given** 已有一条 summary 表达“完成 memory worker reuse”，**When** 查询“跨多次 run 复用后台进程”，**Then** `memory_search` 应能返回该 summary。

### 用户故事 2 - 未配置 embedding 或向量后端不可用时，系统继续回退到当前搜索 (Priority: P2)

作为正在使用插件的用户，我希望即使没有 embedding 配置、或者向量后端暂时不可用，`memory_search` 也不要中断，而是继续退回现在的 SQLite 文本检索。

**为什么这个优先级排第二**：第一刀向量化不能破坏当前已可用的检索主链，回退能力比“最优检索”更重要。

**独立测试方式**：在不配置 embedding 的情况下调用 `memory_search`，验证当前 `LIKE` 搜索结果仍能返回。

**验收场景**：

1. **Given** 未配置任何 embedding 环境变量，**When** 调用 `memory_search`，**Then** 仍返回当前 SQLite 文本匹配结果。
2. **Given** 配置了 embedding，但向量后端初始化失败，**When** 调用 `memory_search`，**Then** 仍返回当前 SQLite 文本匹配结果。

### 用户故事 3 - 本地 embedding API 配置可被真实调用并记录维度 (Priority: P3)

作为准备开源和真实试用的开发者，我希望插件能直接消费本地 OpenAI-compatible embedding API，并以配置的 model/dimensions 运行，以便用我已有的 Qwen embedding 模型做验证。

**为什么这个优先级排第三**：这是上线前必须验证的一步，但它依赖前两项的语义检索主链先成立。

**独立测试方式**：使用真实 `Qwen3-embedding` API 配置，执行一条最小 embedding 请求和一次真实 `memory_search`，验证向量维度与返回结果一致。

**验收场景**：

1. **Given** 配置 `OPENCODE_MEMORY_EMBEDDING_*` 指向本地 OpenAI-compatible 入口，**When** embedding service 生成向量，**Then** 维度必须与配置一致。
2. **Given** 真实 embedding 配置有效，**When** 对已入库 observation 执行 `memory_search`，**Then** semantic retrieval 路径可成功执行。

## 边界情况

- embedding API 返回维度与配置不一致时，系统必须拒绝使用该向量并回退到文本检索。
- 向量索引不可用时，系统不得让 `memory_search` 整体失败。
- 这轮不要求对旧库数据做全量回填；只要求新写入 observation / summary 能进入向量索引。
- 这轮不要求 `timeline/details` 使用向量检索。

## 需求

### 功能需求

- **FR-001**：系统必须支持通过 `OPENCODE_MEMORY_EMBEDDING_API_URL`、`OPENCODE_MEMORY_EMBEDDING_API_KEY`、`OPENCODE_MEMORY_EMBEDDING_MODEL` 配置 OpenAI-compatible embedding API。
- **FR-002**：系统必须支持通过 `OPENCODE_MEMORY_EMBEDDING_DIMENSIONS` 配置并校验 embedding 维度。
- **FR-003**：系统必须支持本地 vector index 抽象，并至少提供 `USearch` 与 `exact-scan` 两种后端。
- **FR-004**：系统必须在 observation / summary 新写入后，将其内容向量化并写入 vector index。
- **FR-005**：`memory_search` 必须优先尝试 semantic retrieval，并在此基础上继续保持当前 summary-first 结果组织。
- **FR-006**：当 embedding 配置缺失、embedding 请求失败、向量后端不可用或维度校验失败时，`memory_search` 必须自动回退到当前 SQLite 文本检索。
- **FR-007**：这轮不得修改 `memory_timeline`、`memory_details`、context builder 主结构或 worker 外部接口。

### 关键实体

- **Embedding Config**：memory 自己持有的 embedding API 配置，包括 URL、API key、model、dimensions。
- **Vector Index**：本地向量检索抽象，负责写入向量、删除向量和执行 nearest-neighbor search。
- **Vector Memory Record**：可被向量化的 memory 文本载体，当前仅包含 observation 与 summary 的搜索文本。

## 成功标准

### 可衡量结果

- **SC-001**：开启 embedding 配置后，`memory_search` 能召回至少 1 条语义相近但不字面匹配的记录。
- **SC-002**：未配置 embedding 或向量后端不可用时，`memory_search` 仍保持当前文本检索可用。
- **SC-003**：真实 `Qwen3-embedding` 配置下，embedding 请求成功并返回与配置一致的向量维度。
- **SC-004**：这轮不改变 `memory_timeline`、`memory_details` 和 context builder 的现有输出行为。
