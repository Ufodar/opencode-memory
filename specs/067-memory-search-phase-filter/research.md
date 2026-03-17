# 研究：Memory Search Phase Filter

## `claude-mem` 对照

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts](/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/worker/search/types.ts)

`claude-mem` 搜索层的成熟度不只在 semantic retrieval，也在 observation metadata filter。

对 `opencode-memory` 来说，最贴当前数据模型的 metadata filter 不是 file/concept，而是现成的：

- `phase`

## 当前 `opencode-memory` 状态

参考：

- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/types.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/types.ts)
- [/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/phase.ts](/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/phase.ts)

当前问题：

- observation phase 已经存在
- searchRecord 里也带 phase
- 但 tool 和 retrieval 都还不能显式按 phase 过滤

## 本轮保守策略

- 只补 `phase`
- phase 只对 observation 生效
- 让 worker 做最终守门，避免下层漏过滤时 summary 混回结果面
