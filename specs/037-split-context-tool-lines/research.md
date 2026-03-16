# 研究记录：Split Context Tool Lines

## `claude-mem` 对照

`claude-mem` 的 Context Index 会把工具使用说明拆成多行：

- 按 ID 取细节
- 查历史
- 先信 index

当前 `opencode-memory` 虽然已经有相同层次的工具说明，但三种 memory 工具仍挤在一行里，可读性更弱。

## 当前仓现状

当前 guide line 还是：

- `memory_details=visible ID -> record detail | memory_timeline=checkpoint window | memory_search=...`

所以当前缺的不是工具能力，而是呈现方式。

## 本轮约束

- 只改 system context 里的工具说明呈现
- 低预算场景允许回退成单行压缩版
- 不改 compaction context
