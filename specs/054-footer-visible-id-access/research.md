# Research: Footer Visible ID Access

## 对照结论

当前 `opencode-memory` 的 `[CONTEXT VALUE]` 最后一行已经会告诉模型：

- 如果当前 index 不够
- 就使用 `memory_details` 和 visible IDs

但这句还没有把 **visible IDs 的作用是取 detail access** 说得足够直接。

本地 `claude-mem` 在 footer 同位置更强调的是：

- access memories by ID

所以这轮只把我们的最后一句收成更明确的 `visible IDs -> detail access` phrasing，不动前两句。
