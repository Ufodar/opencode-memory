# Quickstart：Drop Current Focus Snapshot Field

1. 运行 system/compaction targeted tests，先看到 `Current Focus:` 相关断言失败。
2. 修改 snapshot 字段构造逻辑，去掉 `Current Focus`。
3. 重新运行 targeted tests，确认：
   - snapshot 不再出现 `Current Focus:`
   - `Investigated / Learned / Completed / Next Steps` 仍然存在
   - timeline child line 继续保持 `Next:`
