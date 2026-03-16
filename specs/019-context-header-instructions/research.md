# Research: Context Header Instructions

## 决策 1：这轮只补 header 说明，不补 token economics

- **Decision**: 只新增一个简短的 `[CONTEXT INDEX]` section，不引入 `claude-mem` 的 token economics 数字展示。
- **Rationale**: 当前最真实的差距是“如何引导模型消费这份 index”；token economics 会把范围带到计算和展示策略，超出这轮最小主线。
- **Alternatives considered**:
  - 一次性补齐 header、legend、economics：范围过大，难以判断这轮到底补的是哪一条成熟度差距。
  - 继续只保留现有 guide：不能真正覆盖 `claude-mem` 的“通常够用 / 什么时候再下钻”这条提示。

## 决策 2：用新 section 表达，而不是把原 guide 再写长

- **Decision**: 在 `[CONTINUITY]` 和 `Scope` 之后新增 `[CONTEXT INDEX]` section，再放简短说明和 tool guide。
- **Rationale**: 这样更接近 `claude-mem` 的 header 结构，也更容易让模型把“这是一段使用说明”与后面的 snapshot/timeline 区分开。
- **Alternatives considered**:
  - 直接把原来的几行 guide 改长：输出会更像散句，不像明确 section。
  - 单独加到 `[RESUME GUIDE]`：语义不对，`RESUME GUIDE` 是后续动作，不是 header 说明。
