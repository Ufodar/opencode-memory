# Data Model: Vector Memory Search

## 新增配置对象

### EmbeddingConfig

- `apiUrl: string`
- `apiKey: string`
- `model: string`
- `dimensions: number`
- `backend: "usearch" | "exact-scan"`

## 新增持久化实体

### MemoryVectorRecord

- `recordID: string`
- `recordKind: "observation" | "summary"`
- `projectPath: string`
- `sessionID: string`
- `searchText: string`
- `vector: Float32Array`
- `createdAt: number`
- `updatedAt: number`

## 新增运行时抽象

### VectorIndex

- `upsert(record)`
- `delete(recordID)`
- `search(projectPath, sessionID?, queryVector, limit)`

### SearchTextBuilder

负责把 observation / summary 编译成可向量化文本：

- observation:
  - `content`
  - `input.summary`
  - `output.summary`
  - `tags`
- summary:
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`

## 约束

- 向量维度必须和配置一致
- 同一 `recordID` 只能有一条当前向量记录
- 向量层失败不得阻断当前 memory 主链
- `memory_search` 结果仍要保留 summary-first 组织方式
