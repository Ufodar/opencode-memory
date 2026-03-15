# Host Smoke Regression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 给 `opencode-continuity` 增加一个可重复跑的真实 OpenCode 宿主回归脚本，验证 continuity 主闭环。

**Architecture:** 先把“解析 run 结果并判断 pass/fail”的逻辑抽成纯函数并补测试，再做一个真实 runner 去生成最小宿主配置、调用 `opencode run`、读取 SQLite，并同时输出两层报告：

- `report.json`
  - 给脚本和自动化消费
- `report.md`
  - 给人直接阅读和判断

**Tech Stack:** TypeScript, Bun, OpenCode CLI, SQLite

---

### Task 1: 定义 host smoke 分析器

**Files:**
- Create: `src/testing/host-smoke.ts`
- Test: `tests/testing/host-smoke.test.ts`

**Step 1: Write the failing test**

- 为以下行为写失败测试：
  - 从 JSONL 提取 `sessionID`
  - 判断 write-chain 是否成立
  - 判断 retrieval-chain 是否成立

**Step 2: Run test to verify it fails**

Run: `bun test tests/testing/host-smoke.test.ts`

**Step 3: Write minimal implementation**

- 新增纯函数：
  - `parseRunJsonl`
  - `extractSessionId`
  - `evaluateWriteChain`
  - `evaluateRetrievalChain`

**Step 4: Run test to verify it passes**

Run: `bun test tests/testing/host-smoke.test.ts`

**Step 5: Commit**

```bash
git add tests/testing/host-smoke.test.ts src/testing/host-smoke.ts
git commit -m "feat: add host smoke analysis helpers"
```

### Task 2: 增加真实 runner

**Files:**
- Create: `src/testing/run-host-smoke.ts`
- Modify: `package.json`
- Test: `tests/testing/host-smoke.test.ts`

**Step 1: Write the failing test**

- 先为最小宿主配置生成逻辑写失败测试：
  - 只保留 `agent / provider / model`
  - 不带全局 `mcp`

**Step 2: Run test to verify it fails**

Run: `bun test tests/testing/host-smoke.test.ts`

**Step 3: Write minimal implementation**

- 在 `src/testing/host-smoke.ts` 新增：
  - `buildMinimalHostConfig`
- 在 `src/testing/run-host-smoke.ts` 新增 runner：
  - 生成隔离 HOME
  - 写最小宿主配置
  - 跑 control / robust
  - 读 JSONL
  - 读 SQLite
  - 输出摘要
- 在 `package.json` 增加：
  - `smoke:host`

**Step 4: Run test to verify it passes**

Run: `bun test tests/testing/host-smoke.test.ts`

**Step 5: Verify end-to-end runner**

Run: `bun run smoke:host -- --mode control`

Expected:
- 输出 session id
- 输出 request/observation/summary counts
- 输出 control pass/fail

**Step 6: Commit**

```bash
git add package.json src/testing/host-smoke.ts src/testing/run-host-smoke.ts tests/testing/host-smoke.test.ts
git commit -m "feat: add host smoke regression runner"
```

## 实现后补充

- 已新增：
  - `src/testing/host-smoke.ts`
  - `src/testing/run-host-smoke.ts`
  - `tests/testing/host-smoke.test.ts`
  - `package.json` 中的 `smoke:host`
- 当前真实验证已通过：
  - `bun test`
  - `bun run typecheck`
  - `bun run build`
  - `bun run smoke:host -- --workspace /Users/storm/Documents/code/study_in_happy/downloads/opencode-continuity-host-smoke --mode both`
- 当前 runner 已会在 workspace 下生成：
  - `host-smoke-<timestamp>-report.json`
  - `host-smoke-<timestamp>-report.md`
