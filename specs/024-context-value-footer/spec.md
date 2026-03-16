# 功能规格：Context Value Footer

**Feature Branch**: `[024-context-value-footer]`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: 用户要求继续只沿 `claude-mem` 主线对齐功能，并且每轮都用 `spec-kit` 的 `spec / plan / tasks` 工件推进。

## 先做 `claude-mem` 对照

当前 `opencode-memory` 的 system context 已经有：

- `[CONTEXT INDEX]`
- `[TIMELINE KEY]`
- `[CONTEXT ECONOMICS]`
- project / generated freshness
- visible IDs

但和 `claude-mem` 的 `MarkdownFormatter.renderMarkdownFooter()` 对照后，当前最具体的一条剩余差距是：

- `claude-mem` 在结尾还有一句很直白的价值总结
- 它不是重复数字，而是把上面的 economics 收成一句“为什么这份 index 值得信”的话
- 我们现在有 `[CONTEXT ECONOMICS]` 的数字，但没有这句收尾价值判断

所以这份规格只解决一个问题：

**让 system context 在结尾增加一条简短的 context value footer，把 economics 收成一句“这份 index 为什么值得先信任”的说明。**

这轮保持保守：

- 不改数据库 schema
- 不改 worker runtime
- 不改 retrieval 排序
- 不改 compaction 的主结构

## 用户场景与测试

### 用户故事 1 - system context 结尾给出一句价值总结 (Priority: P1)

当模型读完当前 memory index 后，我希望它在结尾再看到一句很短的总结，明确说明这份 index 已经压缩了多少过去工作，以及应该先信它、不要立刻回头重读旧代码和旧记录。

**为什么这个优先级最高**：这是 `claude-mem` footer 还领先我们的一条具体输出差距。不是新增数据，而是把已有 economics 变成一条更容易被模型消费的结论。

**独立测试方式**：调用 `buildSystemMemoryContext()`，验证输出包含新的 value footer，并且同时保留现有 economics section。

**验收场景**：

1. **Given** system context 中有 summary 与 observation，**When** 输出生成，**Then** 结尾必须出现一条 value footer。
2. **Given** system context 中只有 observation，**When** 输出生成，**Then** value footer 也必须能退化生成。
3. **Given** context economics 已存在，**When** 输出生成，**Then** value footer 必须是总结，不得重复造一个第二套 economics section。

### 用户故事 2 - compaction context 不引入这条 footer (Priority: P2)

当 compaction context 生成时，我不要求它也追加这条 value footer，避免压缩上下文被进一步拉长。

**为什么这个优先级排第二**：`claude-mem` 的 footer 主要服务运行时消费，而不是 compaction 提示词。

**独立测试方式**：调用 `buildCompactionMemoryContext()`，验证 compaction 输出不出现新 footer。

**验收场景**：

1. **Given** 构建 compaction context，**When** 输出生成，**Then** 不应出现新的 context value footer。

## 边界情况

- footer 必须很短，不能重新展开数字解释。
- footer 必须建立在当前注入记录数量上，而不是引入新的统计来源。
- 这轮不改变 `[CONTEXT ECONOMICS]` 的现有内容。
- 这轮不改变 `[RESUME GUIDE]` 或 `[PREVIOUSLY]` 的语义。

## 需求

### 功能需求

- **FR-001**：system context 必须在结尾增加一条简短的 context value footer。
- **FR-002**：这条 footer 必须建立在当前已注入的 summaries / observations / covered observations 数量之上。
- **FR-003**：这条 footer 必须明确表达“先信任当前 index，再决定是否继续下钻”的含义。
- **FR-004**：compaction context 这轮不引入同样的 footer。
- **FR-005**：这轮不得修改数据库 schema、worker runtime、retrieval 排序或 tool surface。

### 关键实体

- **Context Value Footer**：system context 结尾处的一条总结句，用于把当前 economics 和 usage guidance 收成一条更容易消费的价值判断。

## 成功标准

### 可衡量结果

- **SC-001**：system context 中出现新的 value footer。
- **SC-002**：该 footer 不会替代或重复 `[CONTEXT ECONOMICS]`。
- **SC-003**：compaction context 仍不出现这条 footer。
- **SC-004**：这轮不改变 tool surface 和 schema。
