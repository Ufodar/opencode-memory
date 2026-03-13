# Phase-Aware Checkpoint Design

日期：2026-03-13

## 目标

让 `opencode-continuity` 的 request checkpoint 不再只靠：

- `session.idle`
- observation 数量

而是开始利用 observation 本身的阶段信号，把同一 request 内的阶段边界切出来。

## 当前问题

当前行为是：

- 只要到 `session.idle`
- 就从上一个 checkpoint 之后取所有 observation
- 满足最小条件后一次性聚成一条 summary

这会导致两个问题：

1. 同一 request 内的 research 和 execution 容易被糊成一条 summary
2. request 已经支持多 checkpoint，但 checkpoint 仍然不够“懂阶段”

## 方案

第一版采用轻量 deterministic 方案，不引入新对象。

### 阶段分类

基于 observation 的 `tool.name` 和文本信号，推断一个粗粒度 phase：

- `planning`
- `research`
- `execution`
- `verification`
- `decision`
- `other`

### Checkpoint 选择规则

1. 如果 observation 中出现 `decision` 信号，优先把直到该 observation 为止的窗口做成 checkpoint。
2. 如果 observation 序列出现 phase 变化，则优先把“最后一个 phase block 之前”的稳定前缀做成 checkpoint。
3. 如果没有明显 phase 边界，再回退到现有的最小聚合条件。

## 预期结果

- research -> execution 的过渡，不再默认糊成同一条 summary
- 同一 request 可以沿阶段不断生成 checkpoint summary
- 不改变现有 `summary-first retrieval` 和 `summary-first injection` 的接口

## 本轮刻意不做

- 不引入新的 `phase` 表或持久化对象
- 不做 model-assisted phase classification
- 不做复杂 workflow state machine
- 不改变 tool surface
