# Data Model: Project Freshness Header

## 输入对象

### Available Inputs

- `summaries: SummaryRecord[]`
- `observations: ObservationRecord[]`

## 派生字段

### `projectLabel`

- 定义：当前 injected records 所属项目名
- 来源：
  1. `summaries[0].projectPath`
  2. `observations[0].projectPath`
  3. 以上都没有时返回 `undefined`
- 转换：对 `projectPath` 取 basename

### `generatedAtLabel`

- 定义：当前 context build 时间
- 来源：`new Date()`
- 格式：简短、本地可读

## 输出对象

### Project Freshness Header

建议形式：

- `Project: opencode-memory | Generated: 2026-03-16 10:42 CST`

若缺少项目名，则退化为：

- `Generated: 2026-03-16 10:42 CST`
