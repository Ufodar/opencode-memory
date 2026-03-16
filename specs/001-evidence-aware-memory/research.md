# Research: Evidence-Aware Memory

## 目标

确认这一轮为什么仍然属于 `claude-mem` 主线，而不是已经开始发散。

## 对照结论

### `claude-mem` 这一层解决什么

- observation 并不是只保留短摘要
- worker 会先吃到原始：
  - `tool_input`
  - `tool_response`
  - `cwd`
- 但长期保留下来的重点不是整坨原始文本，而是提炼后的结构化证据：
  - `files_read`
  - `files_modified`

### `opencode-memory` 现在做到哪

- 已经把原始 `args/output` 送进 worker
- observation 也已经能落下：
  - `workingDirectory`
  - `filesRead`
  - `filesModified`
  - `command`
- 但这些字段目前只算“已经存下来了”
- 后续 detail / timeline / context 对它们的利用仍不充分

## 为什么这条主线成立

如果这一步不做，会出现一个很真实的问题：

- 我们已经开始存更强的 evidence
- 但后面的 retrieval / timeline / injection 还像没存过一样

这会导致：

- schema 看起来更强
- 真实体验却没有对应增强

所以当前主线不是“再发明新字段”，而是：

**把已经存在的 evidence，真正接进后续消费链。**

## 当前不做什么

- 不做 embedding / 向量库
- 不做 providerRef
- 不做原始 payload 全量存储
- 不做复杂 timeline UI

这些都不是当前和 `claude-mem` 最真实的差距。
