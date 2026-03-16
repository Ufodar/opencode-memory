# Research: Context Legend

## 决策 1：这轮只补 legend，不补 column key 或 economics

- **Decision**: 只新增一个短的 `[TIMELINE KEY]` section，不引入 `claude-mem` 的 column key 和 context economics。
- **Rationale**: 当前最真实的差距是“标签还没被解释”；column key 和 economics 会把范围带到 token 展示层，超出这轮最小主线。

## 决策 2：legend 继续只放在 system context

- **Decision**: `[TIMELINE KEY]` 只进入 system context，不进入 compaction context。
- **Rationale**: compaction prompt 的目标是保留工作 checkpoint，不是教模型阅读 legend。
