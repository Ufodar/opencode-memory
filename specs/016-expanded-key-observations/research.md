# Research: Expanded Key Observations

## 决策 1：这轮只补 `claude-mem` 的“关键 observation 展开”，不做新的 section

- **Decision**: 保持现有 `[LATEST SESSION SNAPSHOT] / [MEMORY TIMELINE] / [RESUME GUIDE] / [PREVIOUSLY]`，只增强 timeline 中 observation 的展示层。
- **Rationale**: 当前与 `claude-mem` 的主要差距已不是“缺少 section”，而是“少量关键 observation 没有被展开成更像工作记录的内容”。
- **Alternatives considered**:
  - 再新增 section：会让 context 继续变长，也会偏离当前最真实差距。
  - 直接做模型辅助 context builder：范围过大，不适合作为这一轮主线。

## 决策 2：关键 observation 只展开极少量最新记录

- **Decision**: 默认只展开极少量最新 observation，而不是对所有 observation 都追加 detail lines。
- **Rationale**: `claude-mem` 的 full observation 也是少量展开；我们当前最重要的是让最近关键动作更可见，而不是把 timeline 重新做成长日志。
- **Alternatives considered**:
  - 展开所有 observation：context 成本过高，且会破坏之前刚做好的去冗余策略。
  - 不区分新旧 observation：会让较旧 observation 抢预算，不符合“恢复最近工作状态”的目标。

## 决策 3：展开内容只用 observation 现有结构化字段

- **Decision**: detail lines 只使用 observation 已有字段，例如 `tool`、`output.summary`、`trace` 等。
- **Rationale**: 当前不新增 schema，也不做新的持久化设计；这一轮是“展示策略增强”，不是“观测模型重建”。
- **Alternatives considered**:
  - 回头改 observation capture 生成更多字段：会把范围扩大到 capture 主链。
  - 运行时重新调模型生成 full observation：超出这一轮主线。
