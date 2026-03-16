# 功能规格：Footer Drilldown Reminder

**Feature Branch**: `[029-footer-drilldown-reminder]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system context footer 已经有：

- `[CONTEXT VALUE]`
- `This index condenses ...`
- `Access ~X tokens of prior work for just ~Y tokens of reading.`

但和 `claude-mem` 的 footer 对照后，当前最真实的一条剩余差距是：

- `claude-mem` 在同一个 footer 位置，还会再补一句动作提醒
- 它会把“这份 index 很值钱”直接接到“如果还不够，就用 ID 下钻”

所以这份规格只解决一个问题：

**在 system context footer 增加一句短提醒，明确当当前 index 不足时，应优先用可见 ID 调 `memory_details` 下钻，而不是重新翻历史。**

这轮保持保守：

- 不新增工具
- 不改变 worker runtime
- 不改变 retrieval 排序
- 不改数据库 schema
- 不改 compaction 的主结构

## 用户场景与测试

### 用户故事 1 - system context footer 直接给出下钻动作提醒 (Priority: P1)

当模型已经读到 `[CONTEXT VALUE]` 时，我希望 footer 直接再给一句短提醒，告诉它：如果当前 index 仍然不够，就用当前可见 ID 去调 `memory_details`，而不是重新翻历史。

**为什么这个优先级最高**：这正是 `claude-mem` 在 footer 位置仍比我们多出来的一句动作指导。不是新能力，只是把已有能力连接得更短。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[CONTEXT VALUE]` 下同时出现量化价值句和 `memory_details` 下钻提醒。

**验收场景**：

1. **Given** system context 中存在 `[CONTEXT VALUE]`，**When** 输出生成，**Then** footer 必须同时保留量化价值句和新的下钻提醒。
2. **Given** 当前 context 已暴露 visible ID，**When** footer 提醒出现，**Then** 阅读者应能直接理解“index 不够时，去用 visible ID 调 `memory_details`”。

### 用户故事 2 - compaction context 不引入这个 footer 提醒 (Priority: P2)

当 compaction context 生成时，我不希望把这句 footer drilldown reminder 一起塞进去，避免压缩 prompt 因为运行时阅读指引而变重。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction context 中不出现这句新提醒。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现 `memory_details` footer 提醒。

## 边界情况

- 提醒必须短，不能盖过已经存在的量化价值句。
- 提醒只出现在 system context，不进入 compaction context。
- 这轮不改变 header guide，也不重复解释 `memory_search` / `memory_timeline`。

## 需求

### 功能需求

- **FR-001**：system context 的 `[CONTEXT VALUE]` section 必须新增一条 footer 级下钻提醒。
- **FR-002**：该提醒必须明确指出：当当前 index 不足时，优先用 visible ID 调 `memory_details`。
- **FR-003**：这句提醒不得替换已有量化价值句，只能追加。
- **FR-004**：compaction context 不得引入这句提醒。
- **FR-005**：这轮不得修改工具面、worker runtime、数据库 schema、retrieval 排序或 context 其他 section 结构。

### 关键实体

- **Footer Drilldown Reminder**：出现在 `[CONTEXT VALUE]` 下的一条短提醒，用来把“index 的价值”直接连接到“visible ID -> memory_details”的下钻动作。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中 `[CONTEXT VALUE]` 同时包含量化价值句和新的 `memory_details` 下钻提醒。
- **SC-002**：compaction context 不出现这句提醒。
- **SC-003**：这轮不改变 tool surface、schema、worker runtime 与 retrieval 排序。
