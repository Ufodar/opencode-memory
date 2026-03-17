# Data Model: Semantic Memory Timeline

## Semantic Timeline Query Input

- `sessionID?: string`
- `query?: string`
- `anchorID?: string`
- `depthBefore: number`
- `depthAfter: number`
- `scope?: "session" | "project"`

说明：
- 显式 `anchorID` 优先级最高
- 只有在 `anchorID` 缺失且 `query` 存在时，才进入 semantic anchor resolution

## Semantic Timeline Anchor Candidate

- `kind: "observation"`
- `id: string`
- `createdAt: number`
- `projectPath: string`
- `sessionID?: string`

说明：
- 这是 worker 内部的临时选择对象，不是新的持久化表
- 这轮不允许 `summary` 成为 query-based automatic anchor

## Timeline Query Resolution

步骤：
1. 若存在 `anchorID`，直接走显式 anchor 路径
2. 若存在 `query`：
   - 先尝试 session semantic observation search
   - 若无结果且允许 project fallback，再尝试 project semantic observation search
   - 若仍无结果，回退到当前文本 query timeline 路径
3. 一旦拿到 semantic observation anchor，就调用现有 `store.getMemoryTimeline(anchorID=...)`

## 不变的持久化对象

这轮不新增新的 SQLite 表，也不改变现有：
- `observations`
- `summaries`
- `memory_vectors`

这轮只增加“怎样消费已有 semantic results”的编排逻辑。
