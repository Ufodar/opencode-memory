# Phase 0 Research: Deduplicated Latest Summary Context

## 决策 1：latest snapshot 成立时，后续 summary section 不再重复 latest summary

- **Decision**: 当 latest summary 已经成功编译成 snapshot 时，`MEMORY SUMMARY` / `Recent memory summaries:` 只保留更早的 summaries。
- **Why**:
  - 当前最明显的真实噪声就是重复
  - `claude-mem` 这一层更像“最近一轮单独快照 + 历史上下文”，而不是把同一条 summary 连续打印两遍
- **Alternatives considered**:
  - 保持重复，等以后统一优化：会让当前真实 preview 继续显得啰嗦

## 决策 2：只跳过“最新一条”，不动更早 summaries

- **Decision**: 如果有多条 summaries，只有最新一条会被 snapshot 吸收；更早的 summaries 仍留在 summary section。
- **Why**:
  - 这一步要解决的是 latest summary 的重复
  - 不是把历史 summaries 都折叠掉
- **Alternatives considered**:
  - 整个 summary section 都删掉：会让历史上下文损失过大

## 决策 3：只有 snapshot 真正有字段时，才跳过 latest summary

- **Decision**: 只有当 latest summary 确实成功编译出 snapshot fields 时，才把它从后续 summary section 里排除。
- **Why**:
  - 避免出现“snapshot 没生成，summary 又被错误隐藏”的情况
- **Alternatives considered**:
  - 只要有 latest summary 就跳过：太脆，可能导致信息丢失
