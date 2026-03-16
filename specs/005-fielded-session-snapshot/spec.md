# 功能规格：Fielded Session Snapshot

**Feature Branch**: `[005-fielded-session-snapshot]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 的 `spec -> plan -> tasks` 推进，并且任何建议都要先对照 `claude-mem` 判断是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- 独立 worker
- semantic observation
- summary-first retrieval / injection
- curated context builder：
  - `[MEMORY SUMMARY]`
  - `[MEMORY TIMELINE]`
  - `[RESUME GUIDE]`

但和 `claude-mem` 对照后，当前最真实的差距已经不是“有没有这些 section”，而是：

- `claude-mem` 会把最近一轮工作拆成更明确的字段
  - `Investigated`
  - `Learned`
  - `Completed`
  - `Next Steps`
- `opencode-memory` 现在虽然有：
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`
  但注入时还没有把这些信息编译成一个清晰的“最近一轮工作快照”

真实宿主里已经能看到这个缺口：

```text
[MEMORY SUMMARY]
- brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件。；目标：让 agent 使用 read 工具读取这个文件。

[RESUME GUIDE]
- Pick up from: brief.txt：这是一个真实 OpenCode 宿主 smoke 测试文件
```

这已经比之前好，但 still 缺一个问题：

**当前会话很难一眼知道：上一轮到底在查什么、完成了什么、下一步是什么。**

所以这份规格只解决一个问题：

**把当前最近一轮 summary 编译成一个更明确的 session snapshot。**

## 用户场景与测试

### 用户故事 1 - 最近一轮工作应该有清晰的结构化快照（Priority: P1)

当 agent 刚进入会话时，我希望它能一眼看到：

- 上一轮在处理什么
- 已经完成了什么
- 下一步接什么

而不是只看到一条 summary 和一条 resume 提示。

**为什么这个优先级最高**：这是当前 `opencode-memory` 与 `claude-mem` 在“工作索引质感”上的下一层真实差距，而且它直接影响 re-entry 的理解速度。

**独立测试方式**：仅构造 latest summary 并调用 system context，就能验证新的 session snapshot 已被正确编译出来。

**验收场景**：

1. **Given** latest summary 有 `requestSummary / outcomeSummary / nextStep`，**When** 构建 system context，**Then** 应新增结构化 snapshot section
2. **Given** latest summary 很长，**When** 构建 snapshot，**Then** 每个字段都应保持短而明确

---

### 用户故事 2 - 没有 `nextStep` 时也要给出清晰恢复方向（Priority: P2)

当 latest summary 没有 `nextStep` 时，我希望系统仍然能给出一个清晰的恢复方向，而不是让 snapshot 出现空洞。

**为什么这个优先级排第二**：当前很多 summary 没有 `nextStep`，如果 snapshot 只在“理想 summary”下成立，就不稳。

**独立测试方式**：构造没有 `nextStep` 的 summary，验证 snapshot 仍能显示 request / completed，并给出合理 fallback。

**验收场景**：

1. **Given** latest summary 没有 `nextStep`，**When** 构建 snapshot，**Then** 仍应显示：
   - 当前这轮在查什么
   - 已完成什么
   - 一个合理的恢复方向

---

### 用户故事 3 - compaction 也应保留这个 session snapshot（Priority: P3)

当会话压缩时，我希望“最近一轮工作快照”也被保留下来，而不是 system preview 和 compaction 两边又出现风格分叉。

**为什么这个优先级排第三**：前几轮已经证明 system / compaction 必须共用一套编译思路，否则很快会漂。

**独立测试方式**：构造 latest summary 并调用 compaction context，验证 compaction 也保留 snapshot 风格信息。

**验收场景**：

1. **Given** latest summary 已存在，**When** 构建 compaction context，**Then** 应保留该轮的 request / completed / next 概要

## 边界情况

- 如果没有 summary，只剩 observation，是否显示 snapshot？答案应为不显示，继续走 timeline/resume fallback。
- 如果 `requestSummary` 很长，snapshot 中也必须裁剪。
- 如果 `nextStep` 缺失，snapshot 不应留空白字段，而应回退到短恢复方向。
- 如果 latest summary 与前一条 summary 信息高度重复，snapshot 只以最新一条为准。
- 不能为了增加 snapshot 而让 system context 超出当前 budget。

## 需求

### 功能需求

- **FR-001**：系统必须把最新一条 summary 编译成一个结构化 session snapshot。
- **FR-002**：session snapshot 必须优先展示：
  - 当前这一轮在处理什么
  - 已完成什么
  - 下一步或恢复方向
- **FR-003**：session snapshot 中的每个字段都必须经过 deterministic 短文本编译，不能原样塞长 summary。
- **FR-004**：当 `nextStep` 缺失时，系统必须给出 fallback 恢复方向。
- **FR-005**：当没有 latest summary 时，系统可以跳过 snapshot，不得强行构造伪字段。
- **FR-006**：system context 和 compaction context 必须保持一致的 snapshot 编译风格。
- **FR-007**：新增 snapshot 后，不得破坏现有：
  - summary-first retrieval / injection
  - curated memory context
  - worker 主闭环
  - host smoke
- **FR-008**：真实宿主 preview 必须比当前更容易一眼看懂“上一轮在做什么、完成了什么、接下来做什么”。

### 关键实体

- **Session Snapshot**：从最新 summary 编译出来的最近一轮工作快照。
- **Snapshot Field**：例如 `Investigating / Completed / Next` 这样的单项短字段。
- **Fallback Resume Direction**：当没有 `nextStep` 时，用于补足恢复方向的 deterministic 文本。

## 成功标准

### 可衡量结果

- **SC-001**：真实宿主 preview 中，能直接看出最近一轮：
  - 在处理什么
  - 已完成什么
  - 下一步是什么
- **SC-002**：没有 `nextStep` 的 summary 也能产出清晰 snapshot，不出现空洞 section。
- **SC-003**：compaction context 也继续保留该 snapshot 视角。
- **SC-004**：`bun test`、`bun run typecheck`、`bun run build`、真实宿主 smoke 全部继续通过。
