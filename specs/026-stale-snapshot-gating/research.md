# Research：Stale Snapshot Gating

## `claude-mem` 对照

- 参考文件：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/SummaryRenderer.ts`
- 关键差距：
  - `shouldShowSummary()` 会在 `mostRecentObservation` 更新时隐藏 latest summary section
  - `opencode-memory` 当前还没有这条 freshness gating

## 当前项目约束

- latest snapshot 当前由：
  - `/src/runtime/injection/compiled-context.ts`
  - `/src/runtime/injection/compaction-context.ts`
  控制
- 现有输入已经包含：
  - latest summary
  - direct observations
  - createdAt

## 决策

- 保持 deterministic
- 只比较 latest summary 与 direct observations 的时间
- stale 时不再渲染 snapshot
- 让 latest summary 回到 timeline
