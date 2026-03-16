# worker 持有 active sessions 设计

## 背景

对照 `claude-mem`，当前 `opencode-memory` 还保留了一份 plugin 侧 `session-tracker`：

- `chat.message`
- `tool.execute.after`
- `final-flush`

都还会碰这份本地状态。

这和 `claude-mem` 的主线不一致。`claude-mem` 的 session 生命周期状态留在 worker / service 内，hook 只是把事件交给 worker，再由 worker 决定：

- 哪些 session 仍然活跃
- 哪些 session 已完成
- shutdown / orphan cleanup 时该收谁

## 当前问题

现在的 plugin 侧 `session-tracker` 有两个结构性问题：

1. 它不是 worker 真相源
   - 真实 memory capture / summary / completion 已经在 worker 内完成
   - plugin 本地再维护一份活跃 session，只会制造双状态

2. 它和 quick-ack worker 形态天然不匹配
   - `captureRequestAnchorFromMessage`
   - `captureObservationFromToolCall`
   在真实 runtime 里已经是 enqueue + quick-ack
   - plugin 本地 tracker 无法代表 worker 内到底真正处理到了哪一步

## 目标

把 active session 真相源收进 worker，并让 plugin 只通过 worker 获取它。

最小目标：

1. worker status snapshot 持有 `activeSessionIDs`
2. worker 在这些时机更新 active sessions：
   - request anchor accepted / persisted
   - observation accepted / persisted
   - session complete
3. `final-flush` 不再读 plugin 本地 tracker
   - 改成先问 worker 当前有哪些 active sessions
   - 再依次 `completeSession`
4. plugin handlers 去掉 `tracker` 依赖

## 方案

### 方案 A：保留 plugin tracker，只把它镜像到 worker

不采用。

原因：
- 还是双状态
- 最终还是得决定谁是真相源

### 方案 B：worker 持有 active sessions，并把它暴露进已有 status snapshot

采用。

原因：
- 不需要额外新接口
- `getQueueStatus()` 已经能返回 `workerStatus`
- `final-flush` 可以直接复用已有 worker client

## 具体改动

### 1. worker 内新增 active session registry

worker 需要维护一份按最近活动排序的 session 集合。

它至少支持：

- `touch(sessionID)`
- `remove(sessionID)`
- `list()`

### 2. status snapshot 增加 `activeSessionIDs`

这样 worker 的活跃 session 真相可以：

- 被 queue/status 读到
- 被 stream/snapshot 读到
- 被 status file 持久化

### 3. final flush 改为问 worker

`beforeExit` 时：

1. 先调用 `worker.getQueueStatus({ limit: 0 })`
2. 取 `workerStatus.activeSessionIDs`
3. 依次 `completeSession(sessionID)`

### 4. 删除 plugin 侧 tracker 依赖

这些地方不再接 `tracker`：

- `chat-message-event`
- `tool-execute-after`
- `session-idle-event`
- `system-transform`
- `session-compacting`
- `index.ts`
- `final-flush`

## 成功标准

1. `session-tracker.ts` 不再参与 runtime 主链
2. `final-flush` 只依赖 worker
3. `workerStatus.activeSessionIDs` 在单测和真实 smoke 中都可见
4. 真实宿主 smoke 继续通过
5. 这一步完成后，session 生命周期状态的真相源只剩 worker
