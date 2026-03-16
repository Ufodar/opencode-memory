# Research: Previously Handoff Context

## `claude-mem` 对照

`claude-mem` 在 context builder 的末尾会调用：

- `getPriorSessionMessages(...)`
- `renderPreviouslySection(...)`

最后输出一段：

- `Previously`
- `A: 上一次 assistant 的最后文本`

证据来自：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/ContextBuilder.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/FooterRenderer.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/utils/transcript-parser.ts`

## 当前差距

`opencode-memory` 已经有：

- `[LATEST SESSION SNAPSHOT]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

但还没有：

- “上一次 assistant 最后说到哪”的直接交接文本

所以当前恢复能力仍然缺一段自然 handoff。

## OpenCode 可行性

OpenCode plugin input 已经提供：

- `client`

而且 `client.session.messages({ sessionID })` 可以直接读取当前 session 全部消息；返回对象里包含：

- `role`
- `parts`

其中 `parts` 里的 `text` part 就足够拼出上一条 assistant 文本。

证据来自：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode/packages/plugin/src/index.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode/packages/sdk/js/src/v2/gen/sdk.gen.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode/packages/opencode/src/session/index.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode/packages/opencode/src/session/message.ts`

## 决策

- 不新增数据库字段。
- 不把 `Previously` 持久化。
- plugin 侧在需要构建 system context 时，现读当前 session 的最后一条 assistant 文本。
- 只改 system context 与 preview；compaction context 本轮不动。
- 文本进入 worker 后，再由统一的 context builder 负责最终渲染。
