# Data Model: Structured Memory Context

## 当前输入对象

- `SummaryRecord[]`
- `ObservationRecord[]`
- `scope`
- `maxSummaries`
- `maxObservations`
- `maxChars`

## 新的中间对象

### `CompiledMemorySection`

```ts
type CompiledMemorySection = {
  title: string
  lines: string[]
}
```

### `CompiledMemoryContext`

```ts
type CompiledMemoryContext = {
  sections: CompiledMemorySection[]
  lines: string[]
}
```

## 设计说明

本轮不改数据库 schema。  
只新增注入层的编译对象，把已有 summary / observation 组合成更结构化的输出。

## 最小 section 设计

1. `MEMORY SUMMARY`
2. `MEMORY TIMELINE`
3. `RESUME GUIDE`

## Resume Guide 的规则来源

仅从已有 summary / observation deterministic 推导，不新增模型调用。
