# 功能规格：Semantic Memory Records

**Feature Branch**: `[003-semantic-memory-records]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 speckit 的 `spec -> plan -> tasks` 推进，并始终以 `claude-mem` 为对照主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经补到了：

- 独立 worker
- 跨多次 `opencode run` 复用 worker
- summary-first retrieval / injection
- 结构化 memory context：
  - `[MEMORY SUMMARY]`
  - `[MEMORY TIMELINE]`
  - `[RESUME GUIDE]`

但和 `claude-mem` 对照后，当前最真实的差距已经不是“有没有 context builder”，而是：

- `claude-mem` 的 observation 更像工作发现，后续 timeline / context 消费的是语义化记录
- `opencode-memory` 当前很多 observation 仍然太像原始工具日志

真实宿主里已经能直接看到这个问题：

```text
[MEMORY SUMMARY]
- read: .../brief.txt；read: .../checklist.md

[MEMORY TIMELINE]
- [research] read: .../brief.txt (files: brief.txt)

[RESUME GUIDE]
- Resume from latest observation: read: .../brief.txt
```

所以这份规格只解决一个问题：

**让 memory record 更像“读到了什么、发现了什么、下一步该恢复什么”，而不是原始 tool 文本。**

## 用户场景与测试

### 用户故事 1 - 下一轮 agent 能看到语义化 observation（Priority: P1)

当 agent 在新一轮会话里查看 memory preview 时，我希望看到的是：

- 文件里主要讲了什么
- 当前发现了什么

而不是只看到：

- `read: 文件路径`
- `write: 文件路径`

**为什么这个优先级最高**：这是当前和 `claude-mem` 在“memory 到底像不像工作索引”上的最大真实差距，而且已经直接影响 preview、resume 和 summary 的可读性。

**独立测试方式**：仅调用 `captureToolObservation()` 和 `memory_context_preview`，就能验证 `read` observation 是否变成语义化记录，不依赖额外模型。

**验收场景**：

1. **Given** `read` 工具输出里包含文件正文，**When** 写入 observation，**Then** observation 的 `content` 应描述主要内容，而不是只写文件路径
2. **Given** `read` 工具输出里包含标题和清单，**When** 写入 observation，**Then** observation 的 `output.summary` 应保留最有价值的 1 到 2 个语义片段
3. **Given** `read` 工具输出是原始 XML payload，**When** 写入 observation，**Then** observation 不得把整个 payload 原样塞进 `content`

---

### 用户故事 2 - summary 和 resume guide 要吃到这种语义记录（Priority: P2)

当一个 request window 被压成 summary，或当前会话生成 `RESUME GUIDE` 时，我希望 summary 和恢复提示延续的是语义化 observation，而不是把原始 tool 名和路径重新重复一遍。

**为什么这个优先级排第二**：如果只改 observation capture，不改后续消费，真实体验仍会停留在“数据库里好一点、preview 里还是不好看”。

**独立测试方式**：构造 request window，生成 summary 和 system context，验证输出中的 `outcomeSummary / RESUME GUIDE` 已不再依赖原始 `read: 路径`。

**验收场景**：

1. **Given** request window 内 observation 已变成语义化记录，**When** 聚合 summary，**Then** `outcomeSummary` 应优先复用这些语义内容
2. **Given** 最近 observation 是语义化记录，**When** 构建 `RESUME GUIDE`，**Then** 恢复提示应引用语义内容而不是原始路径短语

---

### 用户故事 3 - 配置模型时可进一步精炼，但失败时必须回退（Priority: P3)

当环境里配置了 observation 精炼模型时，我希望系统可以把 observation 再压得更适合检索和回注；  
但当模型没配置、超时或失败时，系统必须自动退回 deterministic 结果，不能影响主闭环。

**为什么这个优先级排第三**：这层能进一步靠近 `claude-mem` 的 observation 质量，但不是第一刀的前提。第一刀先保证 deterministic 也有明显提升。

**独立测试方式**：通过 worker service 测试验证：

- 有模型结果时，优先采用模型精炼内容
- 没模型或失败时，继续落 deterministic observation

**验收场景**：

1. **Given** observation model 已配置且返回有效 JSON，**When** capture observation，**Then** 最终 observation 应采用模型精炼后的 `content / outputSummary / tags / importance`
2. **Given** observation model 未配置或请求失败，**When** capture observation，**Then** 最终 observation 仍应采用 deterministic 结果，且 worker 主链不中断

## 边界情况

- `read` 输出只有空白或极短内容时，是否仍然只能回退到文件路径摘要？
- 文件正文是 checklist、markdown 标题、编号清单时，应该如何裁剪成短语义摘要？
- `bash` 输出是长测试日志时，是否仍然只保留结论而不是整段日志？
- observation 已被模型精炼后，是否还要保留 deterministic trace 和 evidence？答案应为保留。
- summary 聚合时，如果 observation 语义摘要差异很小，如何避免把三句近似内容直接拼接成冗余 summary？

## 需求

### 功能需求

- **FR-001**：系统必须为 `read` observation 生成语义化 deterministic 摘要，优先基于文件正文中的高信息量文本，而不是只基于文件路径。
- **FR-002**：系统必须在 deterministic observation 中保留结构化 trace / evidence，不得因语义化而丢失 `workingDirectory / filesRead / filesModified / command`。
- **FR-003**：系统必须避免把原始 `<path> / <content>` payload 全量写入 `content` 或 `output.summary`。
- **FR-004**：summary 聚合必须优先消费语义化 observation 的 `output.summary / content`，使 `outcomeSummary` 更像阶段结论而不是工具日志拼接。
- **FR-005**：`RESUME GUIDE` 必须优先引用语义化 observation 或 semantic summary，不得回退到原始 payload 文本。
- **FR-006**：当配置了 observation model 时，系统可以用模型结果覆盖 `content / outputSummary / tags / importance`，但失败时必须自动回退 deterministic 结果。
- **FR-007**：新增语义化逻辑后，不得破坏现有：
  - worker 主闭环
  - summary-first retrieval / injection
  - timeout / abort / fallback 纪律
- **FR-008**：新增语义化逻辑后，真实宿主 smoke 中 `memory_context_preview` 的输出必须比当前更像工作发现，而不是原始 `read: 路径` 记录。

### 关键实体

- **Semantic Observation**：语义化 observation，描述这次工具调用主要发现了什么，而不是仅记录工具名或路径。
- **Observation Refinement Result**：可选模型精炼结果，可覆盖 deterministic observation 的文本层，但不能抹掉 trace / evidence。
- **Semantic Summary**：基于语义化 observation 聚合得到的阶段摘要，应服务于 summary、timeline 和 resume guide。

## 成功标准

### 可衡量结果

- **SC-001**：真实宿主 `memory_context_preview` 输出中，`[MEMORY SUMMARY]` 和 `[RESUME GUIDE]` 至少有一条不再是 `read: 文件路径` 形式。
- **SC-002**：`captureToolObservation()` 对包含文件正文的 `read` 输出，能稳定生成语义化摘要而不是路径摘要。
- **SC-003**：启用 observation model 时，worker 能优先采用模型精炼结果；关闭或失败时，主闭环继续通过。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build`、真实宿主 smoke 全部继续通过。
