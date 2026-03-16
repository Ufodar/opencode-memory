# 功能规格：Inline Observation Type Tags

**Feature Branch**: `[030-inline-observation-type-tags]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 observation timeline 行已经会显示：

- 时间前缀
- phase 标签
- 文件分组
- visible ID

但和 `claude-mem` 的 timeline 行对照后，当前最真实的一条剩余差距是：

- `claude-mem` 的每一行 observation 本身就会带 type 提示
- 我们当前只有“展开的 observation”才会在下一行出现 `Tool: read/write/bash`
- 折叠的 observation 行仍然不能一眼看出它是 `read`、`write` 还是 `bash`

所以这份规格只解决一个问题：

**让每条 observation timeline 行都内联显示一个很短的 tool/type tag，并让 `[TIMELINE KEY]` 同时解释这个 tag。**

这轮保持保守：

- 不新增 phase
- 不改变 summary 渲染
- 不改变 retrieval 排序
- 不改数据库 schema
- 不改 worker runtime

## 用户场景与测试

### 用户故事 1 - 折叠的 observation 行也能直接看出工具类型 (Priority: P1)

当模型阅读 `[MEMORY TIMELINE]` 时，我希望就算 observation 没有展开，也能直接看出它来自 `read`、`write`、`bash` 等哪类工具，而不必等到 `Tool:` 明细行才知道。

**为什么这个优先级最高**：这是 `claude-mem` timeline 行仍比我们多出来的一层快速辨识信息。不是更多数据，而是让当前行本身更容易消费。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 observation timeline 行本身出现短 tool/type tag；展开 observation 仍保留 `Tool:` 明细。

**验收场景**：

1. **Given** system context 中有 `read` observation，**When** timeline 输出生成，**Then** observation 主行必须出现一个短 `read` tag。
2. **Given** system context 中有 `write` 或 `bash` observation，**When** timeline 输出生成，**Then** observation 主行必须出现对应短 tag。
3. **Given** observation 仍会展开 detail line，**When** `Tool:` 行继续存在，**Then** inline tag 只做快速辨识，不替代 detail line。

### 用户故事 2 - header 同步解释新的短 tag (Priority: P2)

当 system context 增加了 inline tool/type tag 时，我希望头部的 `[TIMELINE KEY]` 也一起解释这类 tag，避免模型只看到新符号但不知道它是什么意思。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证 `[TIMELINE KEY]` 里新增对 tool/type tag 的说明；compaction context 继续不带这条说明。

**验收场景**：

1. **Given** system context 输出生成，**When** `[TIMELINE KEY]` 出现，**Then** 它必须解释新的 tool/type tag。
2. **Given** compaction context 输出生成，**When** 内容被压缩，**Then** 不应引入这条 header 说明。

## 边界情况

- tag 必须短，不能让 observation 主行变得更难读。
- tag 必须稳定，不能依赖模型生成。
- 如果 tool 名为空，允许不显示 tag。
- 这轮不改变 `Tool:` detail line，也不改变已有 phase 标签。

## 需求

### 功能需求

- **FR-001**：system context 的每条 observation timeline 主行必须支持显示短 tool/type tag。
- **FR-002**：该 tag 必须来自已有 observation/tool 数据，而不是新模型输出。
- **FR-003**：展开 observation 的 `Tool:` detail line 必须保留。
- **FR-004**：`[TIMELINE KEY]` 必须补充对该 tag 的说明。
- **FR-005**：compaction context 不得引入新的 header 说明。
- **FR-006**：这轮不得修改 schema、worker runtime、retrieval 排序或 summary 渲染。

### 关键实体

- **Inline Observation Type Tag**：渲染在 observation timeline 主行上的短 tag，用来让折叠 observation 也能快速暴露工具类型。

## 成功标准

### 可衡量结果

- **SC-001**：system context 的 observation 主行带短 tool/type tag。
- **SC-002**：展开 observation 仍保留 `Tool:` detail line。
- **SC-003**：`[TIMELINE KEY]` 解释了这个 tag。
- **SC-004**：compaction context 不出现新的 header 说明。
