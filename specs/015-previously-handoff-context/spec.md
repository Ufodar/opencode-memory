# 功能规格：Previously Handoff Context

**Feature Branch**: `[015-previously-handoff-context]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

但和 `claude-mem` 对照后，当前最真实的剩余差距已经变成：

- `claude-mem` 在 context 最后还会带一段 `Previously`
- 这段内容不是 summary，也不是 timeline
- 它表达的是：**上一次 assistant 最后说到了哪里**

我们现在虽然已经能告诉模型：

- 最近做过什么
- 哪些 observation / summary 值得恢复
- 下一步大致应该做什么

但还不能告诉模型：

- **上一次 assistant 的自然语言交接文本是什么**

所以这份规格只解决一个问题：

**在当前 session 有 assistant 文本消息时，把最后一条 assistant 文本编进 system context 的 `Previously` section。**

## 用户场景与测试

### 用户故事 1 - system context 带上上一条 assistant 交接文本 (Priority: P1)

当 session 里已经存在 assistant 文本消息时，我希望当前 memory context 里能多一段 `Previously`，告诉模型上一次 assistant 停在哪里。

**为什么这个优先级最高**：这是 `claude-mem` 当前还领先我们的一条真实恢复能力，而且直接影响“重新接手工作”时的自然交接感。

**独立测试方式**：构造一条 `priorAssistantMessage`，调用 `buildSystemMemoryContext()`，验证输出包含 `Previously` section，并显示整理后的 assistant 文本。

**验收场景**：

1. **Given** 当前 session 有上一条 assistant 文本消息，**When** 构建 system context，**Then** 输出必须包含 `Previously` section。
2. **Given** 上一条 assistant 消息包含多段 text parts，**When** 构建 system context，**Then** 应合并成一段整理后的文本，而不是丢失内容或显示对象结构。

---

### 用户故事 2 - 没有 assistant 文本时不添加空 section (Priority: P2)

当 session 里没有可用的 assistant 文本时，我希望 system context 保持当前结构，不要插入空的 `Previously` section。

**为什么这个优先级排第二**：这保证 `Previously` 是真实恢复信息，不是固定模板噪声。

**独立测试方式**：不给 `priorAssistantMessage`，调用 `buildSystemMemoryContext()`，验证输出不包含 `Previously` section。

**验收场景**：

1. **Given** 当前 session 没有 assistant 文本，**When** 构建 system context，**Then** 输出中不得出现 `Previously` section。

## 边界情况

- 只有 tool 调用、没有 assistant text 时，不应生成 `Previously`。
- assistant 文本里若存在多余空白或空行，应先做整理再显示。
- `Previously` 必须和现有 `[LATEST SESSION SNAPSHOT]`、`[MEMORY TIMELINE]`、`[RESUME GUIDE]` 共存，不能替代它们。
- 这轮不改变 compaction context。
- 这轮不新增数据库字段，不把 `Previously` 持久化进 SQLite。

## 需求

### 功能需求

- **FR-001**：system context 在存在上一条 assistant 文本时，必须追加 `Previously` section。
- **FR-002**：`Previously` section 必须使用整理后的 assistant 文本，而不是原始对象或 parts 数组结构。
- **FR-003**：没有 assistant 文本时，system context 不得输出空的 `Previously` section。
- **FR-004**：`memory_context_preview` 必须反映同样的 `Previously` section，因为它复用 system context。
- **FR-005**：这轮功能必须只影响 system context 侧，不改变 compaction context、timeline 检索或 summary 生成。

### 关键实体

- **Prior Assistant Message**：当前 session 中最后一条 assistant 文本消息，经过去空白、合并 text parts 后形成的短交接文本。
- **Previously Section**：system context 中追加的一段只读恢复信息，用来表达上一次 assistant 最后停在哪里。

## 成功标准

### 可衡量结果

- **SC-001**：给定 `priorAssistantMessage` 时，system context 输出中出现 `Previously` section。
- **SC-002**：不给 `priorAssistantMessage` 时，system context 不出现 `Previously` section。
- **SC-003**：`memory_context_preview` 输出与 system context 保持一致，能看到同样的 `Previously` section。
- **SC-004**：现有的 snapshot / timeline / resume guide 输出不被破坏。
