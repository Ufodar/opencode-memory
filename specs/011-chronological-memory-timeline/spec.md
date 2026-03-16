# 功能规格：Chronological Memory Timeline

**Feature Branch**: `[011-chronological-memory-timeline]`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: 用户要求继续严格按 `spec-kit` 推进，并且每轮都先用 `claude-mem` 对照确认这轮 spec 是否仍在主线。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 已经做到：

- timeline 有 summary checkpoint
- timeline 有 observation checkpoint
- checkpoint 已带 request 语义
- checkpoint 已带短时间前缀

但和 `claude-mem` 对照后，当前最真实的差距已经变成：

- `claude-mem` 会把 summary 和 observation 混在一起按时间排序
- 我们现在的 `[MEMORY TIMELINE]` 还是：
  - 先输出 summary checkpoint
  - 再输出 observation checkpoint
- 这意味着只要 observation 比 summary 更早，当前输出顺序就会反

所以这份规格只解决一个问题：

**让 memory timeline checkpoint 真正按时间混排，而不是按类型分块。**

## 用户场景与测试

### 用户故事 1 - system timeline 应按时间混排 summary 与 observation (Priority: P1)

当当前会话查看 `[MEMORY TIMELINE]` 时，我希望 timeline 里的 summary 与 observation 是按真实时间顺序排列，而不是先看完全部 summary 再看 observation。

**为什么这个优先级最高**：这是当前 timeline 和 `claude-mem` 时间线最直接的结构差距。

**独立测试方式**：构造一个比 summary 更早的 observation，调用 `buildSystemMemoryContext()` 验证输出顺序。

**验收场景**：

1. **Given** observation 时间早于 summary，**When** 构建 system context，**Then** observation 应排在 summary 前面
2. **Given** summary 时间早于 observation，**When** 构建 system context，**Then** summary 应排在 observation 前面

### 用户故事 2 - compaction timeline 也应按时间混排 (Priority: P2)

当 compaction context 渲染 timeline checkpoint 时，我希望它和 system context 使用同样的时间混排规则。

**为什么这个优先级排第二**：system / compaction 必须共享同一套 timeline 组织纪律。

**独立测试方式**：构造 summary 与 observation 交错时间顺序，调用 `buildCompactionMemoryContext()` 验证。

## 边界情况

- 最新 summary 仍然只留在 snapshot，不参与 older timeline 混排。
- 只混排真正进入 timeline 的 older summaries 与 unsummarized observations。
- 同时间戳项目可保持稳定次序，不需要引入复杂 tie-break 规则。
- 不能破坏 `010` 的时间前缀。

## 需求

### 功能需求

- **FR-001**：system timeline 必须对 older summaries 与 unsummarized observations 做统一排序。
- **FR-002**：排序依据应为 `createdAt` 升序，形成从旧到新的 checkpoint 流。
- **FR-003**：compaction timeline 必须复用同一套排序规则。
- **FR-004**：现有 checkpoint 内容编译规则不变，只改顺序。

## 成功标准

### 可衡量结果

- **SC-001**：system timeline 在 summary 与 observation 交错时，输出顺序与时间顺序一致。
- **SC-002**：compaction timeline 使用相同的混排规则。
- **SC-003**：`010` 的短时间前缀仍然保留。
