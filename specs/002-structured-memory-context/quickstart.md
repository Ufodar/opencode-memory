# Quickstart: Structured Memory Context

## 目标

验证 `memory_context_preview` 与 system injection 都升级为结构化 memory context。

## 步骤

1. 运行单测

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun test tests/runtime/system-context.test.ts tests/tools/retrieval-tools.test.ts
```

2. 查看 preview 输出

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory
bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-memory-host-smoke --mode control
```

3. 检查最新报告中的 preview 相关输出文件

## 预期

- preview 不再只是两段平铺列表
- 输出里能看到：
  - summary section
  - timeline section
  - resume guide
- budget 仍然受控
