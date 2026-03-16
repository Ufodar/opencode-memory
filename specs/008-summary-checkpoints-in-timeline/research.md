# Research: Summary Checkpoints In Timeline

## `claude-mem` 对照

### 当前看到的事实

- `claude-mem` 的 timeline 是统一时间线，不只放 observation  
  证据：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/ObservationCompiler.ts`
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/TimelineRenderer.ts`

- 它会先把 summaries 准备成 timeline item，再和 observations 合并排序  
  证据：
  - `prepareSummariesForTimeline(...)`
  - `buildTimeline(...)`

- 它仍然会单独渲染最近一条 summary 的字段  
  证据：
  - `/Users/storm/Documents/code/study_in_happy/projects/claude-mem/src/services/context/sections/SummaryRenderer.ts`

## 当前 `opencode-memory` 的差距

- latest summary 已经有 `[LATEST SESSION SNAPSHOT]`
- older summaries 还单独放在 `[MEMORY SUMMARY]`
- `[MEMORY TIMELINE]` 目前只有 observation

这说明当前差距不是“有没有 summary”，而是：

**timeline 里还没有 summary checkpoint。**

## 本轮决策

1. 不动 latest snapshot  
2. 只把 older summaries 挪进 timeline  
3. 不保留重复的 `[MEMORY SUMMARY]`  
4. 继续 deterministic，暂不引入新的模型编译
