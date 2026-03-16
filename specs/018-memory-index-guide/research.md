# Research: Memory Index Guide

## 决策 1：guide 只进 system context，不进 compaction

- **Decision**: 这轮 guide 只出现在 system context，不复用到 compaction context。
- **Rationale**: `claude-mem` 这层 guide 的作用是告诉当前模型如何消费 memory index，不是为了给 compaction prompt 加额外说明。
- **Alternatives considered**:
  - system / compaction 都加 guide：会污染 compaction prompt。
  - 完全不加 guide：继续缺少 `claude-mem` 当前已有的“如何使用 index”层。

## 决策 2：guide 只给工具使用建议，不重复解释现有 sections

- **Decision**: guide 重点说明 `memory_details / memory_timeline / memory_search` 的使用路径，不重复说明 snapshot / timeline / resume 具体字段。
- **Rationale**: 当前最重要的不是再解释 section 名，而是告诉模型“什么时候进一步调用哪个工具”。
- **Alternatives considered**:
  - 详细解释每个 section：太长，且重复已有 section 内容。
  - 只写一句笼统提示：不够像 `claude-mem` 的 index guide。
