# 数据模型：Memory Search Kind Filter

## Tool 输入

`memory_search` 新增可选字段：

- `kind?: "summary" | "observation"`

## Worker 输入

`searchMemoryRecords` 新增可选字段：

- `kinds?: Array<MemorySearchRecord["kind"]>`

## Store 输入

`searchMemoryRecords` 新增可选字段：

- `kinds?: Array<MemorySearchRecord["kind"]>`

## 不变项

- `MemorySearchRecord` 输出结构不变
- hybrid merge / 去重策略不变
- 未指定 `kind` 时行为不变
