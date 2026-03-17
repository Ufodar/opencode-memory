# Quickstart: Language-Neutral Memory Core

## 1. 英文 decision signal

运行：

```bash
bun test tests/summary/checkpoint-selection.test.ts
```

预期：

- 英文 `Decision:` observation 可以进入 checkpoint
- 英文 `Next step:` observation 也可被识别为 decision-like

## 2. 英文 retrieval-only prompt

运行：

```bash
bun test tests/runtime/chat-message.test.ts
```

预期：

- 纯英文 memory lookup / preview prompt 被跳过
- 含真实工作意图的混合 prompt 继续保留 request anchor

## 3. 输出语言配置

运行：

```bash
bun test tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts
```

预期：

- 默认 prompt 要求英文输出
- `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh` 时 prompt 要求中文输出
- 英文弱 next step 如 `continue working` 会被丢弃
