# Data Model：Split Context Tool Lines

本轮不改数据库 schema。

只调整 `[CONTEXT INDEX]` 中工具说明的渲染形状：

- 正常预算：拆成三条独立 bullet
- 低预算：回退到单行压缩版

影响范围仅限：

- system context header
- 相关测试断言
