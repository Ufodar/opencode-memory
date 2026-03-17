# Research: Language-Neutral Memory Core

## `claude-mem` 对照结论

- `claude-mem` 在 observation / summary / context 这些层面，默认文本与类型体系都更偏通用英文，不绑定中文环境。
- `claude-mem` 的 observation type 更结构化，例如 `decision`、`bugfix`、`feature`、`discovery`，说明同层更多依赖显式分类，而不是只靠自然语言关键词。
- 相比之下，`opencode-memory` 当前的差距主要不在主闭环缺失，而在：
  - heuristics 还不够 language-neutral
  - 某些规则还不够 metadata-first

## 当前仓库的真实问题

### 1. decision signal 偏中文

- 位置：`src/memory/observation/phase.ts`
- 现状：`DECISION_SIGNAL_PATTERN` 主要靠“形成决策”“下一步”“先...”这类中文词拍板
- 风险：英文工作流下，checkpoint 质量会下降；开源读者也会直接看出中文环境偏置

### 2. retrieval-only prompt 识别规则面偏窄

- 位置：`src/runtime/hooks/chat-message.ts`
- 现状：虽然已有少量英文规则，但主要只覆盖 `do not read any files` 和 `only call memory_*`
- 风险：英文 prompt 容易漏过，导致 memory lookup 被记成正式 request

### 3. model output 语言写死中文

- 位置：
  - `src/services/ai/model-summary.ts`
  - `src/services/ai/model-observation.ts`
- 现状：system prompt 明确要求中文输出
- 风险：默认行为不适合作为通用 OSS 插件，也让英文测试样例显得别扭

## 设计选择

### 选择：最小 language-neutral baseline

这轮只做：

- 中英双语 decision signal
- 更完整的英文 retrieval-only prompt 识别
- 可配置的模型输出语言

### 不做

- 全量 i18n
- context builder 文案多语言化
- 结构化 decision type 重构
- 彻底去掉所有文本 heuristics

## 理由

- 这是最直接影响开源定位的生产逻辑
- 改动面集中在 4 个核心文件
- 不会打断现有 worker / vector / context builder 主线
