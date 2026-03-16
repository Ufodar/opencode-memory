# Research: Drop Redundant Context Index Coverage

## `claude-mem` 对照

- 当前 `claude-mem` 同位置的 context index 首句已经承担：
  - semantic index
  - dimensions
  - sufficiency
- 它没有再跟一条独立的 coverage bullet

## 当前仓差距

- 我们已经把 dimensions 和 sufficiency 都写进首句
- 但仍然保留了一条重复的：
  - `Covers summaries, phases, tools, files, and tokens.`

## 本轮保持不动的部分

- 首句 wording
- trust line
- drilldown bullets
- compaction context
- worker / schema / retrieval
