# Research：Snapshot Investigated

## `claude-mem` 对照

- 参考文件：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/SummaryRenderer.ts`
- 关键差距：
  - `claude-mem` latest summary fields 包含 `Investigated`
  - `opencode-memory` 当前只有 `Current Focus / Learned / Completed / Next`

## 当前项目约束

- latest snapshot 字段来自：
  - `/src/runtime/injection/curated-context-text.ts`
  - `/src/runtime/injection/compiled-context.ts`
- 现有 evidence 来源已经足够：
  - `trace.filesRead`
  - `trace.filesModified`
  - `trace.command`

## 决策

- 保持 deterministic
- 优先从 latest summary 覆盖的 observation trace 提取 `Investigated`
- system / compaction 共用这套字段
