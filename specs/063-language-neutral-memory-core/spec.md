# 功能规格：Language-Neutral Memory Core

**Feature Branch**: `[063-language-neutral-memory-core]`  
**Created**: 2026-03-17  
**Status**: Implemented  
**Input**: 用户要求继续推进开源准备，并指出生产代码里仍存在中文优先匹配与不够完整的关键字规则。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的主闭环已经成立，但在“开源可接受性”这一层还存在几处明显差距：

- `phase.ts` 的 decision signal 主要靠中文词判断
- `chat-message.ts` 的 retrieval-only prompt 识别虽然已有少量英文规则，但整体仍偏窄
- `model-summary.ts` / `model-observation.ts` 仍把输出语言写死为中文

对照本地 `claude-mem`，同层更成熟的做法是：

- 更少依赖自然语言关键词直接拍板
- 更偏结构化类型、metadata 和显式策略
- prompt 文本默认以通用英文为主，而不是绑定某个本地语言环境

所以这份规格只解决一个收口主题：

**把 `opencode-memory` 的核心 heuristics 和模型输出约束推进到 language-neutral baseline，使其更适合以通用 OpenCode memory plugin 的身份开源。**

这轮保持克制：

- 不改 worker runtime 主结构
- 不改 vector retrieval 主链
- 不改 context builder 的 section 编排
- 不改 summary / observation 数据模型
- 不引入 providerRef、多语言 UI、i18n 框架

## 用户场景与测试

### 用户故事 1 - 英文决策信号也能稳定形成 checkpoint (Priority: P1)

作为使用英文工作流的用户，我希望当 observation 明确表达 `Decision:`、`Next step:` 等信号时，系统仍能像中文环境一样正确识别 `decision`，而不是漏掉 summary checkpoint。

**为什么这个优先级最高**：这是当前最直接影响开源通用性的生产 heuristics，而且它已经会影响 summary 聚合行为，不只是文案问题。

**独立测试方式**：给 checkpoint selection 提供英文 decision signal 的 observation，验证系统仍把它当成 `decision`。

**验收场景**：

1. **Given** observation 内容包含 `Decision: produce a gap checklist before drafting`, **When** 选择 checkpoint observations，**Then** 系统应保留该 observation 并允许生成 checkpoint。
2. **Given** observation 内容包含 `Next step: validate the smoke report`, **When** 识别 decision signal，**Then** 系统应把它视为可提取下一步的 decision-like observation。

### 用户故事 2 - 纯 memory 回查的英文提示也不会污染 request history (Priority: P1)

作为用英文写 prompt 的用户，我希望当我只要求 memory lookup / preview 时，系统不要把这类请求记成正式工作 request。

**为什么这个优先级同样是 P1**：这是 request history 是否干净的控制逻辑，直接影响 summary window 和后续上下文质量。

**独立测试方式**：给 `captureRequestAnchor()` 输入几种英文 retrieval-only prompt，验证它们被正确跳过；同时验证普通工作 prompt 不会被误杀。

**验收场景**：

1. **Given** prompt 为 `Memory lookup only. Do not read files. Use only memory_search for prior notes.`, **When** 调用 `captureRequestAnchor`，**Then** 返回 `null`。
2. **Given** prompt 为 `Preview memory context only. Do not inspect repository files. Use only memory_context_preview.`, **When** 调用 `captureRequestAnchor`，**Then** 返回 `null`。
3. **Given** prompt 为 `Investigate the bug and use memory_search only if needed.`, **When** 调用 `captureRequestAnchor`，**Then** 仍应保留该 request anchor。

### 用户故事 3 - 模型输出语言不再写死中文 (Priority: P2)

作为准备开源该插件的维护者，我希望 summary / observation 的模型提示能配置输出语言，而不是永远要求中文，这样仓库默认行为才更像通用插件。

**为什么这个优先级排第二**：这是通用定位的重要一环，但它不会像前两项那样直接影响 checkpoint / request history 主控制逻辑。

**独立测试方式**：通过 fake fetch 捕获请求体，验证默认 prompt 使用英文要求；当环境变量显式设置为 `zh` 时，仍可生成中文要求。

**验收场景**：

1. **Given** 未设置输出语言环境变量，**When** 调用 model summary / observation 生成，**Then** 请求里的 system prompt 应要求英文输出。
2. **Given** 设置 `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh`, **When** 调用 model summary / observation 生成，**Then** prompt 应要求中文输出。
3. **Given** summary 结果返回 `continue working`, **When** 规范化 next step，**Then** 它应被识别为弱 next step 并丢弃。

## 边界情况

- 英文 decision signal 不能宽到把普通 `generated output` 误判成 `decision`
- retrieval-only prompt 识别必须继续要求：
  - 明确出现 memory tool
  - 明确要求不要读文件/只做 memory work
- 输出语言配置只影响模型 prompt 与弱 next step 过滤；这轮不改已有 deterministic context 文案
- 这轮不做完整 i18n；只提供最小可配置语言约束

## 需求

### 功能需求

- **FR-001**：系统必须能识别常见英文 decision signals，并与现有中文 decision signal 一起工作。
- **FR-002**：英文 decision heuristics 不得把普通 “generated / output / wrote ...” 误判为 `decision`。
- **FR-003**：系统必须能识别更完整的英文 retrieval-only prompts，并继续跳过对应 request anchor。
- **FR-004**：普通工作 prompt 即使提到 memory tools，也不得被误判成 retrieval-only prompt。
- **FR-005**：model summary 与 model observation 的输出语言必须可配置。
- **FR-006**：未显式配置时，模型输出语言默认应面向通用 OSS 使用场景。
- **FR-007**：弱 next step 过滤必须同时覆盖中英文空泛短语。

### 关键实体

- **Decision Signal**：用来让 observation 进入 `decision` 语义的最小文本信号。
- **Retrieval-Only Prompt**：只要求调用 memory tools、不要求读取工作区文件或推进新工作的用户输入。
- **Output Language Policy**：控制 model summary / model observation prompt 期望输出语言的配置对象。

## 成功标准

### 可衡量结果

- **SC-001**：英文 `Decision:` / `Next step:` observation 能触发与中文同等的 checkpoint selection 结果。
- **SC-002**：至少两类英文 retrieval-only prompt 会被正确跳过，而包含真实工作意图的混合 prompt 不会被误杀。
- **SC-003**：默认情况下 model summary / observation prompt 不再要求中文输出。
- **SC-004**：显式设置中文输出语言时，现有中文工作流仍可保留。
