# Quickstart: Semantic Memory Records

## 1. 运行单测

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test
```

重点关注：

- `tests/runtime/tool-after.test.ts`
- `tests/services/memory-worker-service.test.ts`
- `tests/runtime/system-context.test.ts`

## 2. 运行类型检查与构建

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run typecheck
bun run build
```

## 3. 运行真实宿主 smoke

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control
```

## 4. 验证结果

重点看真实宿主 preview 输出是否仍然是：

```text
read: .../brief.txt
```

目标是至少出现一条更像工作发现的文本，例如：

```text
这是一个真实 OpenCode 宿主 smoke 测试文件，目标是验证 observation / summary / retrieval 主闭环。
```

不要求逐字一致，但必须明显比“路径摘要”更接近文件内容。
