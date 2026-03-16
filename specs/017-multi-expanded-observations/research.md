# Research: Multi Expanded Observations

## 决策 1：这轮只改“展开几条”，不改“展开什么”

- **Decision**: 继续复用 `016` 的 `Result / Tool / Evidence` detail lines，只把 expanded observation window 从 1 条推进到最近 2 条。
- **Rationale**: 当前和 `claude-mem` 的剩余差距首先是“只展开 1 条”；detail line 内容本身刚完成，不适合马上又重构。
- **Alternatives considered**:
  - 同时重写 detail line 内容：范围变大，难以判断这轮到底补的是数量差距还是内容差距。
  - 继续停留在 1 条：与 `claude-mem` 这一层的能力不对齐。

## 决策 2：默认只推进到 2 条，而不是一下做成很大窗口

- **Decision**: 当前默认窗口设为最近 2 条 expanded observation。
- **Rationale**: `claude-mem` 确实允许多条展开，但我们当前还没有它那套更完整的 token economics / header/footer 管理，先走到 2 条更稳。
- **Alternatives considered**:
  - 直接展开 5 条：更接近 `claude-mem` 默认安装值，但对当前简化版 context builder 来说风险更高。
  - 做成外部配置：这轮主线是行为对齐，不是配置系统扩展。
