# Quickstart: Nonredundant File Grouped Timeline

## 验证步骤

1. 运行：
   - `bun test tests/runtime/system-context.test.ts`
   - `bun test tests/runtime/compaction-context.test.ts`
2. 确认 timeline 里仍有：
   - `[file] brief.txt`
3. 确认 observation 行不再重复：
   - `(files: brief.txt)`
4. 确认：
   - `cmd:` 这类提示不受影响
   - `[day]` 分组仍然存在
