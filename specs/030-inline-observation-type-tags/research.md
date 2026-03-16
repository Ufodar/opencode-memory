# Research: Inline Observation Type Tags

## `claude-mem` 对照

参考文件：

- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/TimelineRenderer.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/formatters/MarkdownFormatter.ts`

关键点：

- `claude-mem` 的 observation 行本身就会带 type 提示
- 所以就算不展开单条 observation，也能先看出这行是研究、编辑还是别的工作类型

## 当前 `opencode-memory` 状态

当前文件：

- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`

当前已经有：

- phase 标签
- day/file 分组
- visible ID
- 展开 observation 才会出现 `Tool: ...`

缺的是：

- 折叠的 observation 主行没有短 tool/type tag

## 本轮策略

- 不新增 observation type schema
- 直接复用现有 `observation.tool.name`
- 只在 system context observation 主行添加短 `{tool}` tag
- 同步补 `[TIMELINE KEY]` 说明
