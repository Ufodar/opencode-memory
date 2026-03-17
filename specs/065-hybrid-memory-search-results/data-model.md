# 数据模型：Hybrid Memory Search Results

这轮不新增持久化字段。

## 输入

- semantic results: `MemorySearchRecord[]`
- text results: `MemorySearchRecord[]`

## 输出

- merged results: `MemorySearchRecord[]`

## 合并规则

1. 同一 scope 下先拿 semantic results，再拿 text results
2. 按 `kind + id` 去重
3. 最终继续按 summary-first 纪律返回
4. 截断到 `limit`

## 不变项

- `MemorySearchRecord` 结构不变
- `memory_search` tool 输出结构不变
- `scope` 语义不变
