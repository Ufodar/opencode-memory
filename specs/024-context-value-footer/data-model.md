# Data Model：Context Value Footer

本 feature 不新增持久化数据模型。

## 输入

- `summaryCount`
- `directObservationCount`
- `coveredObservationCount`

这些字段都已经在 `buildCompiledMemoryContext()` 里可得。

## 输出

- 一组短文本行，用于 system context 末尾渲染
- 不写数据库
- 不进 compaction context
