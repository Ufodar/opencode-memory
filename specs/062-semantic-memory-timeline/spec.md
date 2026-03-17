# 功能规格：Semantic Memory Timeline

**Feature Branch**: `[062-semantic-memory-timeline]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续按 `claude-mem` 主线对齐，不发散到别的层。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经有：

- `memory_search` 的第一版 semantic retrieval
- `memory_timeline` 的 query / anchor 双入口

但 `memory_timeline` 的 query 入口仍然主要依赖当前 `searchRecords()` 的文本检索去选 anchor。

而 `claude-mem` 在同一层已经具备：

- 先用 query 做语义 observation 搜索
- 再用命中的 observation 直接拉 timeline

所以这份规格只解决一个最小差距：

**让 `memory_timeline` 在收到 query 时，优先尝试语义 observation 搜索来确定 timeline anchor；找不到时，再回退到当前文本路径。**

这轮保持保守：

- 不改 `memory_search` 的结果面
- 不改 `memory_details`
- 不改 context builder
- 不改 summary 数据模型
- 不改 providerRef / Chroma / 更重的 hybrid orchestration

## 用户场景与测试

### 用户故事 1 - 语义 query 能直接拉到相关 observation 的 timeline (Priority: P1)

作为调用 `memory_timeline` 的 agent，我希望即使 query 和 observation 不是字面匹配，只要语义相近，也能直接找到合适的 observation 当 anchor，并拉出时间线。

**为什么这个优先级最高**：这是当前 `opencode-memory` 和 `claude-mem` 在 timeline 查询层最直接的差距，也是已有 semantic retrieval 最自然的下一步消费面。

**独立测试方式**：写入一组 observation，其中 anchor observation 与 query 语义相近但没有明显字面重合；开启 embedding 配置后调用 `memory_timeline` 的 query 模式，验证 timeline 能围绕该 observation 展开。

**验收场景**：

1. **Given** 已有 observation 表达“修复 worker 端口冲突”，且其前后还有相关 observation，**When** 查询“解决后台监听占用问题”，**Then** `memory_timeline` 应以该 observation 为 anchor 返回时间线。
2. **Given** 当前 session 内已有语义相关 observation，**When** 未显式指定 scope 地调用 `memory_timeline(query=...)`，**Then** 应优先使用 session 范围内的语义 observation 作为 anchor。

### 用户故事 2 - 语义 timeline query 失败时，回退到当前文本 anchor 解析 (Priority: P2)

作为正在使用插件的用户，我希望即使 embedding 配置缺失、向量检索失败或没有 semantic hit，`memory_timeline` 也不要整体失效，而是继续使用当前 query -> text anchor 的路径。

**为什么这个优先级排第二**：timeline 是检索纪律的一部分，第一刀不能为了语义能力破坏当前可用性。

**独立测试方式**：关闭 embedding 配置或让 semantic search 返回空结果，调用 `memory_timeline(query=...)`，验证它仍能通过当前文本查询拿到 timeline。

**验收场景**：

1. **Given** 未配置 embedding 环境变量，**When** 调用 `memory_timeline(query=...)`，**Then** 仍返回当前文本 anchor 路径的 timeline。
2. **Given** 配置了 embedding，但 semantic search 没有命中 observation，**When** query 文本本身能命中 observation，**Then** 系统应继续使用文本命中的 observation 构建 timeline。

### 用户故事 3 - 语义 timeline query 不改变显式 anchor 行为 (Priority: P3)

作为需要精确控制 anchor 的 agent，我希望当我显式传入 `anchor` 时，系统仍然按显式 anchor 构建 timeline，而不是被 query 语义路径覆盖。

**为什么这个优先级排第三**：这是避免回归的重要守门条件，但它依赖前两项先把 query 语义路径接通。

**独立测试方式**：同时提供显式 anchor 与 embedding 配置，调用 `memory_timeline(anchor=...)`，验证系统仍以显式 anchor 为准。

**验收场景**：

1. **Given** 提供了合法 `anchor`，**When** 调用 `memory_timeline`，**Then** 必须继续围绕该 anchor 构建 timeline，而不是重新做 query 语义搜索。

## 边界情况

- semantic search 只能把 observation 作为 query-based timeline anchor；不能让 summary 直接冒充 observation anchor。
- session 范围 semantic 没命中时，可以继续按当前 scope 规则回退到 project。
- semantic search 命中 summary 时，这轮不使用它做 query timeline anchor。
- 这轮不要求把 semantic retrieval 扩到 `memory_details`。

## 需求

### 功能需求

- **FR-001**：当 `memory_timeline` 以 `query` 模式调用时，系统必须优先尝试语义 observation 搜索来选择 anchor。
- **FR-002**：query-based semantic timeline 搜索必须继续遵守当前 `session -> project` 的 scope 语义。
- **FR-003**：query-based semantic timeline 搜索只允许 observation 作为自动 anchor。
- **FR-004**：当 embedding 配置缺失、semantic search 失败或无 observation 命中时，系统必须回退到当前文本 anchor 解析路径。
- **FR-005**：显式 `anchor` 模式不得被 semantic query 路径改变。
- **FR-006**：这轮不得修改 `memory_search` 的返回结构、`memory_details` 的行为或 context builder 主结构。

### 关键实体

- **Semantic Timeline Anchor**：由 query 触发的、语义命中的 observation anchor。
- **Timeline Query Resolution**：根据 query、scope 和 fallback 规则，决定最终用哪个 observation 作为 timeline anchor 的过程。

## 成功标准

### 可衡量结果

- **SC-001**：开启 embedding 配置后，`memory_timeline(query=...)` 能围绕至少 1 条语义相近但不字面匹配的 observation 返回 timeline。
- **SC-002**：未配置 embedding 或 semantic search 无 observation 命中时，`memory_timeline(query=...)` 仍保持当前文本 timeline 可用。
- **SC-003**：显式 `anchor` 调用不受 semantic timeline query 新逻辑影响。
