# 功能规格：Timestamped Memory Timeline Checkpoints

**Feature Branch**: `[010-timestamped-memory-timeline-checkpoints]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- older summaries 已进入 `[MEMORY TIMELINE]`
- summary checkpoint 已带 request 语义
- observation checkpoint 也已带 phase 与最小 evidence

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 的 timeline item 会直接带时间
- 我们现在的 `[MEMORY TIMELINE]` 只有内容，没有时间感
- 当前会话虽然能看到“做了什么”，但还不够容易看出“先后顺序和大概发生在什么时候”

所以这份规格只解决一个问题：

**让 memory timeline checkpoint 带短时间标记，而不是只有内容。**

## 用户场景与测试

### 用户故事 1 - system timeline 的 checkpoint 应带短时间标记 (Priority: P1)

当当前会话查看 `[MEMORY TIMELINE]` 时，我希望 summary 与 observation checkpoint 都能带短时间标记，这样能直接看出事件顺序，而不是只看到一串内容。

**为什么这个优先级最高**：这是当前 unified timeline 与 `claude-mem` 之间最直接、最具体的剩余差距。

**独立测试方式**：构造带真实 epoch 毫秒时间戳的 summary 与 observation，调用 `buildSystemMemoryContext()` 验证时间标记。

**验收场景**：

1. **Given** older summary 有真实 epoch 毫秒时间戳，**When** 构建 system context，**Then** `[summary]` checkpoint 应带短时间前缀
2. **Given** observation 有真实 epoch 毫秒时间戳，**When** 构建 system context，**Then** observation checkpoint 应带短时间前缀
3. **Given** synthetic 测试值或缺失时间戳，**When** 构建 system context，**Then** 仍可回退为无时间前缀，保持兼容

### 用户故事 2 - compaction timeline 的 checkpoint 也应带短时间标记 (Priority: P2)

当 compaction context 渲染统一 timeline checkpoint 时，我希望同样能看到短时间标记，而不是只有内容。

**为什么这个优先级排第二**：system / compaction 需要继续共享同一套 timeline checkpoint 编译纪律。

**独立测试方式**：构造带真实 epoch 毫秒时间戳的 summary 与 observation，调用 `buildCompactionMemoryContext()` 验证。

## 边界情况

- 时间标记必须短，不把 timeline 重新变成长日志。
- 时间标记需要 deterministic，避免不同环境下测试不稳定。
- 旧测试里使用的 synthetic `createdAt: 10/20/30` 这类值，不应被误当成真实时间显示成无意义的 `00:00`。
- 不能破坏 `009` 的 request-aware summary checkpoint 纪律。

## 需求

### 功能需求

- **FR-001**：system timeline 的 summary checkpoint 应优先带短时间标记。
- **FR-002**：system timeline 的 observation checkpoint 应优先带短时间标记。
- **FR-003**：compaction timeline 的 summary / observation checkpoint 也必须复用同一套短时间标记规则。
- **FR-004**：若时间戳不是可信的 epoch 毫秒值，checkpoint 可以退化为无时间前缀。
- **FR-005**：时间标记必须 deterministic、短、不会破坏现有 budget 控制。

## 成功标准

### 可衡量结果

- **SC-001**：system timeline 中的 `[summary]` 与 observation checkpoint 能直接看出大概时间顺序。
- **SC-002**：compaction timeline checkpoint 使用同样的短时间格式。
- **SC-003**：旧的 synthetic 测试 fixture 不需要全部迁移也能保持兼容。
