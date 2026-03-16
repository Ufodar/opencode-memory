# 功能规格：Evidence-Aware Memory

**Feature Branch**: `[001-evidence-aware-memory]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续沿 `claude-mem` 主线推进，并使用 `spec / plan / tasks` 形式保证过程可见、规范、全面。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经补到了：

- 独立 worker
- pending job 持久化
- summary-first retrieval / injection
- observation 证据字段初步增强：
  - `workingDirectory`
  - `filesRead`
  - `filesModified`
  - `command`

但与 `claude-mem` 对照后，当前真实差距已经不再主要落在 “有没有 worker”。  
更主要落在：

- observation 里新增的证据字段，还没有真正被后续 `retrieval / timeline / context` 吃进去
- timeline 和上下文仍然主要依赖短摘要，而不是更强的结构化工作证据

所以这份规格只解决一个问题：

**让已经落库的 observation 证据，真正进入后续检索、时间线和上下文构建。**

## 用户场景与测试

### 用户故事 1 - 调试时能看到更强的 observation 证据（Priority: P1)

当我查看 memory detail 时，我希望不只看到一段压缩摘要，还能直接看到：

- 这条 observation 的工作目录
- 它读了哪些文件
- 它改了哪些文件
- 它执行了什么命令

这样我才能判断这条 memory 到底是不是和当前问题相关。

**为什么这个优先级最高**：这是最直接补齐 `claude-mem` 证据层差距的一步，而且对后续 timeline / context 都是基础。

**独立测试方式**：仅实现 detail 层后，调用 `memory_details` 就能独立验证是否返回了这些证据字段，不依赖 search 或 injection 同时完成。

**验收场景**：

1. **Given** 一条 `read` observation 已落库，**When** 调用 `memory_details`，**Then** 返回结果中包含 `workingDirectory` 与 `filesRead`
2. **Given** 一条 `write` observation 已落库，**When** 调用 `memory_details`，**Then** 返回结果中包含 `filesModified`
3. **Given** 一条 `bash` observation 已落库，**When** 调用 `memory_details`，**Then** 返回结果中包含 `command`

---

### 用户故事 2 - timeline 能利用文件证据，而不是只看摘要（Priority: P2)

当我调用 `memory_timeline` 时，我希望 timeline 不只是按时间排 observation / summary，还能利用文件读写证据给出更像工作轨迹的上下文。

这不要求第一版做到复杂可视化，但至少要让 timeline item 能携带足够的证据信息，供后续渲染和 anchor 解释使用。

**为什么这个优先级排第二**：timeline 已经存在，但它目前对新增证据字段利用不足。补完这一层后，timeline 才更接近 `claude-mem` 的“按工作证据理解时间线”。

**独立测试方式**：实现后，仅调用 `memory_timeline`，验证 observation item 中已经能拿到关键证据字段，不依赖 injection。

**验收场景**：

1. **Given** 一条包含 `filesRead` 的 observation，**When** 调用 `memory_timeline`，**Then** 返回的 observation item 带有可供渲染的文件证据
2. **Given** 一条包含 `filesModified` 的 observation，**When** 调用 `memory_timeline`，**Then** timeline anchor 和 items 不会丢掉该证据

---

### 用户故事 3 - system/compaction 注入能在预算内带出关键信息来源（Priority: P3)

当 worker 为 system prompt 或 compaction prompt 构建记忆上下文时，我希望它不只是告诉模型“做过什么”，还要在预算允许时告诉模型“这些结论主要来自哪些文件或命令”。

第一版不追求长文本，只追求：

- 在预算内优先补最有价值的证据提示
- 不把注入文本变成冗长日志

**为什么这个优先级排第三**：这层最贴近 `claude-mem` 的 context 价值，但也最容易把 prompt 变噪，所以必须在 detail / timeline 之后再做。

**独立测试方式**：只验证 system/compaction context builder 的输出包含简短证据提示，并继续满足 budget 约束。

**验收场景**：

1. **Given** 一条 observation 带 `filesRead`，**When** 构建 system context，**Then** 注入文本会在 budget 内带出文件线索
2. **Given** 一条 observation 带 `command`，**When** 构建 compaction context，**Then** 注入文本可带出命令线索且不超过预算

## 边界情况

- observation 同时包含 `filesRead` 和 `filesModified` 时，渲染顺序如何确定？
- observation 只含 `workingDirectory` 但没有文件路径时，是否值得在 context 中显示？
- `bash` observation 只有命令、没有明确文件路径时，timeline 是否仍应展示证据？
- 一条 summary 覆盖了多条 observation，detail 中应如何显示这些 observation 的证据，避免重复与噪声？
- 当 evidence 很多时，context builder 应如何裁剪，避免打破当前 budget 纪律？

## 需求

### 功能需求

- **FR-001**：系统必须在 observation detail 中暴露结构化证据字段，至少包括：
  - `workingDirectory`
  - `filesRead`
  - `filesModified`
  - `command`
- **FR-002**：系统必须在 `memory_details` 返回中保留这些字段，而不是只返回压缩摘要。
- **FR-003**：系统必须让 `memory_timeline` 的 observation item 可访问关键证据字段，供 timeline 渲染和 anchor 解释使用。
- **FR-004**：system context builder 必须能在 budget 允许时带出精简证据提示，但不能把全文命令输出或原始 payload 直接注入。
- **FR-005**：compaction context builder 必须与 system context 保持一致的证据使用纪律：只带精简线索，不带原始大段日志。
- **FR-006**：系统不得把这次增强退化成“存整坨原始 tool_input / tool_response”，必须继续保持结构化证据优先。
- **FR-007**：新增证据利用后，现有 `summary-first` 纪律不得被破坏。
- **FR-008**：新增证据利用后，现有 `session-first / project-fallback` 与 budget 纪律不得被破坏。

### 关键实体

- **Observation Evidence**：附着在 observation 上的结构化工作证据，包括工作目录、读文件集合、改文件集合、命令。
- **Timeline Observation Item**：timeline 中表示 observation 的视图对象，需决定暴露哪些证据字段。
- **Injected Evidence Hint**：进入 system/compaction 上下文的精简证据提示，是 observation evidence 的短文本投影，不是原始 payload。

## 成功标准

### 可衡量结果

- **SC-001**：`memory_details` 对 observation 的返回中，能够稳定包含新增的结构化证据字段。
- **SC-002**：`memory_timeline` 的 observation item 能利用新增证据字段，而不是只保留摘要级信息。
- **SC-003**：system/compaction context 在 budget 约束下能输出简短证据提示，且现有相关测试继续通过。
- **SC-004**：全量测试、类型检查、构建、真实宿主 smoke 全部继续通过。
