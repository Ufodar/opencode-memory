# Quickstart: File Grouped Memory Timeline

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts`
   - `bun test tests/runtime/compaction-context.test.ts`
2. 确认 system / compaction timeline 都会在 observation 前插入：
   - `[file] brief.txt`
3. 确认：
   - 同一文件的连续 observation 不重复插入文件分组
   - summary 会打断文件分组
   - 跨天 `[day] YYYY-MM-DD` 仍然保留
