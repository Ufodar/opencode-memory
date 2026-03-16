# Data Model: Memory Index Guide

## MemoryIndexGuide

表示 system context 开头的一小段只读说明，不新增持久化字段。

### Fields

- `headline`: 当前 memory snapshot 的用途说明
- `toolHints`: 一组 tool 使用提示

## ToolHint

### Fields

- `toolName`: `memory_details` | `memory_timeline` | `memory_search`
- `usage`: 该工具适合什么时候用

## 约束

- guide 必须简短
- 只在 system context 出现
- 不持久化到 SQLite
