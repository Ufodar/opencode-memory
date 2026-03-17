# 研究：Memory Search Kind Filter

## `claude-mem` 对照

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts)

`claude-mem` 搜索层当前已经支持显式类型过滤：

- `searchType`
- `obsType`
- `concepts`
- `files`

对 `opencode-memory` 来说，当前最自然的对应层不是一次性补所有 filter，而是先补：

- `summary`
- `observation`

## 当前 `opencode-memory` 状态

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/tools/memory-search.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/tools/memory-search.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/memory-worker-service.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/storage/sqlite/retrieval-query-service.ts)

当前问题：

- semantic path 已有 `kinds?`
- text path 还没有外部显式 `kind` 输入
- tool surface 还没有把这种过滤暴露出去

## 本轮保守策略

- 只补 `kind`
- 不补 `phase/tool/file/concept`
- 不改 timeline/details
- 先复用现有 semantic `kinds` 支持
