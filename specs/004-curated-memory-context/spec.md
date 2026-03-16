# 功能规格：Curated Memory Context

**Feature Branch**: `[004-curated-memory-context]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 的 `spec -> plan -> tasks` 推进，并且每一步都必须先对照 `claude-mem` 判断是否还在主线里。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经具备：

- 独立 worker
- summary-first retrieval / injection
- 结构化 memory context：
  - `[MEMORY SUMMARY]`
  - `[MEMORY TIMELINE]`
  - `[RESUME GUIDE]`
- semantic observation

但和 `claude-mem` 对照后，当前最真实的差距已经不是“有没有这些 section”，而是：

- `claude-mem` 的 context builder 更像整理过的工作索引
- `opencode-memory` 当前虽然语义化了，但很多输出仍然像长串摘抄

真实宿主里已经能看到这个问题：

```text
[MEMORY SUMMARY]
- brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；让 opencode-memory 通过 tool.execute.after 写入 observation。；checklist.md：Smoke Checklist；插件在真实 OpenCode 宿主中加载；`read` 工具被调用；smoke-summary.txt：这是一份 OpenCode 宿主 smoke 测试文件...

[RESUME GUIDE]
- Resume from latest summary: brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。；让 opencode-memory 通过 tool.execute.after 写入 observation。；checklist.md：Smoke Checklist...
```

所以这份规格只解决一个问题：

**让注入给当前会话的 memory context，更像简洁的工作索引，而不是长串摘抄。**

## 用户场景与测试

### 用户故事 1 - `MEMORY SUMMARY` 应该像阶段摘要而不是长串拼接（Priority: P1)

当 agent 读取当前 session memory 时，我希望 `MEMORY SUMMARY` 直接告诉它：

- 上一轮主要做了什么
- 形成了什么阶段结果

而不是把多个 observation 语义片段直接拼接成一整条长句。

**为什么这个优先级最高**：这是当前和 `claude-mem` 在 context builder 质量上的最大真实差距，而且已经直接影响真实宿主 preview 的可读性和恢复效率。

**独立测试方式**：仅构造 summary record 和 system context，就能验证 `MEMORY SUMMARY` 是否已经从“长串摘抄”变成更短、更像阶段结论的文本。

**验收场景**：

1. **Given** summary 覆盖多个 semantic observation，**When** 构建 system context，**Then** `MEMORY SUMMARY` 应优先显示短的阶段结果，而不是把所有 observation 原样拼接
2. **Given** summary 很长，**When** 构建 system context，**Then** `MEMORY SUMMARY` 应做更强裁剪，避免一条 summary 占满全部 budget
3. **Given** 多条 summary 在裁剪后得到相同文本，**When** 构建 system context，**Then** 不应重复显示相同的 summary line

---

### 用户故事 2 - `MEMORY TIMELINE` 应该像恢复索引而不是语义堆叠（Priority: P2)

当 agent 查看 timeline 时，我希望看到的是：

- 哪一步发生了什么
- 相关文件或证据是什么

而不是继续看到长 observation 句子堆叠。

**为什么这个优先级排第二**：timeline 已经有结构，但还不够“恢复导向”。如果 timeline 仍然太长，agent 还是得自己二次提炼。

**独立测试方式**：仅构造 timeline 项，验证输出中的每一条 timeline item 已限制在更短、更像 checkpoint 的形式。

**验收场景**：

1. **Given** timeline item 对应一条长 semantic observation，**When** 生成 `MEMORY TIMELINE`，**Then** timeline item 应优先显示短 checkpoint 文本，再补最小 evidence hint
2. **Given** timeline item 已有 phase 和 files，**When** 生成 timeline，**Then** 输出应保留 phase / files，但 observation 正文要更短

---

### 用户故事 3 - `RESUME GUIDE` 应该优先给下一步动作，而不是重复摘要（Priority: P3)

当 agent 恢复工作时，我希望 `RESUME GUIDE` 更像：

- 现在最应该接着做什么

而不是把上一轮 summary 再重复一遍。

**为什么这个优先级排第三**：resume guide 已经存在，但现在仍可能退化成“重复 summary 长句”。它应该更动作化、更恢复导向。

**独立测试方式**：构造 summary / observation 组合，验证 `RESUME GUIDE` 优先使用 `nextStep` 或短 action phrase，而不是原样重复长 summary。

**验收场景**：

1. **Given** summary 有 `nextStep`，**When** 构建 `RESUME GUIDE`，**Then** 应优先输出短动作句
2. **Given** summary 没有 `nextStep` 但有 semantic observation，**When** 构建 `RESUME GUIDE`，**Then** 应基于 observation 生成短恢复提示，而不是整段重复 summary

## 边界情况

- 如果 summary 本身只有一条短句，是否还需要再裁剪？答案应为不强行裁剪。
- 如果 observation 已经很短，timeline 是否仍然可以直接复用？答案应为可以。
- 如果 summary 很长但 `nextStep` 很短，resume 是否应只保留 `nextStep`？答案应为是。
- 如果没有 summary，是否允许 resume 回退到 observation？答案应为允许，但仍应限制长度。
- 如果同一个 summary 覆盖多个文件，timeline 是否要列全文件？答案应为只保留最小必要 hint。

## 需求

### 功能需求

- **FR-001**：系统必须把 `MEMORY SUMMARY` 优先展示成阶段性结果，而不是 observation 文本拼接。
- **FR-002**：系统必须对过长 summary 做更强裁剪，避免单条 summary 占满当前注入预算。
- **FR-002A**：系统必须避免在 `MEMORY SUMMARY` 中重复显示裁剪后相同的 summary line。
- **FR-003**：系统必须让 `MEMORY TIMELINE` 的 observation item 更像短 checkpoint，而不是长语义摘抄。
- **FR-004**：`MEMORY TIMELINE` 必须继续保留最小 phase / evidence hint，但正文要明显短于原 observation。
- **FR-005**：`RESUME GUIDE` 必须优先使用短动作提示，不得默认重复整条长 summary。
- **FR-006**：当 `nextStep` 缺失时，系统可以基于 summary / observation 生成 deterministic 短恢复提示。
- **FR-007**：新增裁剪和编译规则后，不得破坏现有：
  - summary-first retrieval / injection
  - semantic observation
  - worker 主闭环
  - host smoke
- **FR-008**：真实宿主 `memory_context_preview` 输出必须比当前更像“工作索引”，而不是“长串摘抄”。

### 关键实体

- **Curated Summary Line**：供 `MEMORY SUMMARY` 使用的短阶段摘要行。
- **Curated Timeline Item**：供 `MEMORY TIMELINE` 使用的短 checkpoint 行。
- **Resume Action Hint**：供 `RESUME GUIDE` 使用的短动作恢复提示。

## 成功标准

### 可衡量结果

- **SC-001**：真实宿主 preview 中，`MEMORY SUMMARY` 至少有一条比当前明显更短，且仍保留阶段结果。
- **SC-002**：真实宿主 preview 中，`RESUME GUIDE` 不再只是整条 summary 的重复。
- **SC-003**：system context 和 compaction context 继续通过现有测试与 smoke，不引入回归。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build`、真实宿主 smoke 全部继续通过。
