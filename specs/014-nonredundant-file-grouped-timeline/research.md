# Research: Nonredundant File Grouped Timeline

## `claude-mem` 对照

- `claude-mem` 在文件分组后，会把文件名放在分组层，不会在每条 observation 行里继续重复。
- `opencode-memory` 在 `013` 后已经有 `[file] brief.txt`，但 observation 行仍然保留 `(files: brief.txt)`。

## 当前差距

- 这不是缺能力，而是冗余输出。
- 当前最自然的补法不是改变 trace schema，而是在 timeline 编译时：当 observation 已被文件分组覆盖，就不再重复显示 `files:` evidence hint。

## 决策

- 不新增 schema。
- 不动 summary。
- 只在 system / compaction context 编译阶段，抑制“已被文件分组覆盖的 `files:` hint”。
