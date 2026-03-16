# Quickstart: Inline Observation Token Hints

1. 在 system context 中构造至少 1 条 observation
2. 验证 observation 主行出现：
   - `Read ~X | Work ~Y`
3. 验证 expanded observation detail 仍然保留：
   - `Tokens: Read ~X | Work ~Y`
4. 验证 compaction context observation 主行不出现 inline token hint
