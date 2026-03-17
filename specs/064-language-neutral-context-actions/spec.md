# 功能规格：Language-Neutral Context Actions

**Feature Branch**: `[064-language-neutral-context-actions]`  
**Created**: 2026-03-17  
**Status**: Implemented  
**Input**: 在 `063` 收掉核心 heuristics 后，deterministic context 里仍残留少量中文恢复提示，影响通用 OSS 观感。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system / compaction context 已经大体对齐 `claude-mem` 的 section 结构，但在 deterministic fallback 文案里还残留两处中文前缀：

- `继续从...开始`
- `继续处理...`

这些字符串出现在：

- latest snapshot 的 `Next Steps` fallback
- `RESUME GUIDE` / compaction snapshot 的恢复提示

对照 `claude-mem` 同层输出，这一层默认是英文、通用、面向继续工作的 action copy，而不是绑定中文环境。

所以这份规格只解决一个差距：

**让 deterministic context action copy 也遵守 output language policy，默认英文，显式 `zh` 时保留中文。**

这轮保持保守：

- 不改 context builder 结构
- 不改 summary / observation 数据模型
- 不改 tool surface
- 不改 model prompt

## 用户场景与测试

### 用户故事 1 - 默认 context fallback 用英文动作提示 (Priority: P1)

作为阅读 system context 的用户，我希望当 summary 没有显式 `nextStep` 时，snapshot 和 resume guide 的 fallback 动作提示默认是英文，这样公开仓库的默认输出更通用。

**为什么这个优先级最高**：这是 `063` 之后还留在生产输出里最明显的中文环境痕迹，而且它会直接出现在当前会话注入文本里。

**独立测试方式**：不给 summary 设置 `nextStep`，验证默认 system / compaction context 中出现 `Continue from ...` 或 `Continue with ...`，而不是中文前缀。

**验收场景**：

1. **Given** latest summary 没有 `nextStep` 但有 `outcomeSummary`，**When** 构建 system context，**Then** `Next Steps` 与 `RESUME GUIDE` 应默认使用英文 fallback。
2. **Given** latest summary 只有 `requestSummary` 而没有 `nextStep` / `outcomeSummary`，**When** 构建 fallback 动作提示，**Then** 默认应使用英文 `Continue with ...`。

### 用户故事 2 - 显式中文策略仍保留中文 fallback (Priority: P2)

作为仍在中文工作流中使用插件的用户，我希望显式设置中文输出策略后，deterministic context fallback 继续使用中文，而不是强制切英文。

**为什么这个优先级排第二**：这轮主目标是默认 OSS 观感，但不能破坏当前中文使用路径。

**独立测试方式**：设置 `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh`，验证 snapshot / compaction fallback 继续输出中文前缀。

**验收场景**：

1. **Given** `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh`，**When** 构建 system context，**Then** fallback 继续使用 `继续从...开始` / `继续处理...`。
2. **Given** `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh`，**When** 构建 compaction context，**Then** `Next Steps` fallback 继续使用中文。

## 边界情况

- 这轮只改 deterministic fallback prefix，不翻译现有 summary / observation 内容本身
- 显式 `nextStep` 存在时，继续原样消费 `buildResumeActionText(nextStep)`；不强制翻译已有内容
- 不改 `Next action:` / `Pick up from:` 这些已经是英文的外围 label

## 需求

### 功能需求

- **FR-001**：当未显式设置输出语言时，snapshot / resume guide 的 deterministic fallback 动作提示默认必须为英文。
- **FR-002**：当显式设置 `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh` 时，deterministic fallback 动作提示必须继续使用中文。
- **FR-003**：显式 `nextStep` 存在时，本轮不得改写其内容。
- **FR-004**：这轮不得改变 context builder 的整体 section 结构。

## 成功标准

### 可衡量结果

- **SC-001**：默认情况下，system context 与 compaction context 不再出现 `继续从...开始` / `继续处理...` 作为 fallback 文案。
- **SC-002**：显式中文策略下，这些 fallback 文案仍然存在。
