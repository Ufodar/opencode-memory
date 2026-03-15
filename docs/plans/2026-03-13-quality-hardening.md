# Quality Hardening Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 `opencode-memory` 当前 V1 主闭环里的 4 个高优先级质量风险，使其更接近 `claude-mem` 的运行时稳健性。

**Architecture:** 这轮不扩展新能力边界，不引入独立 worker。只收紧现有 `plugin-internal pipeline`：为 model summary 增加 timeout，为 observation 提供更高信息密度主文本，为 `session.idle` summary 链增加 session 级重入保护，并收紧 phase/decision 启发式判定。所有改动都先通过测试刻画目标行为，再做最小实现。

**Tech Stack:** TypeScript, Bun, bun:test, SQLite, OpenCode plugin hooks

---

### Task 1: model-assisted summary timeout

**Files:**
- Modify: `src/services/ai/model-summary.ts`
- Test: `tests/summary/model-summary.test.ts`

**Step 1: Write the failing test**

- 增加一个测试，模拟 `fetchImpl` 长时间不返回。
- 目标行为：
  - 在显式 timeout 到达后，`generateModelSummary()` 返回 `null`
  - 不抛未处理异常

**Step 2: Run test to verify it fails**

Run: `bun test tests/summary/model-summary.test.ts`

Expected:
- 新测试失败
- 失败原因是当前实现没有 timeout 逻辑

**Step 3: Write minimal implementation**

- 在 `model-summary.ts` 中加入：
  - timeout 配置
  - `Promise.race` 或等价机制
  - timeout 后记录日志并返回 `null`
- 保持现有 deterministic fallback 契约不变

**Step 4: Run test to verify it passes**

Run: `bun test tests/summary/model-summary.test.ts`

Expected:
- 新旧测试均通过

**Step 5: Commit**

```bash
git add src/services/ai/model-summary.ts tests/summary/model-summary.test.ts
git commit -m "fix: add timeout to model summary generation"
```

### Task 2: stronger observation content

**Files:**
- Modify: `src/runtime/hooks/tool-after.ts`
- Modify: `src/storage/sqlite/memory-store.ts`
- Modify: `src/runtime/injection/system-context.ts`
- Test: `tests/storage/retrieval-surface.test.ts`
- Create: `tests/runtime/tool-after.test.ts`

**Step 1: Write the failing tests**

- 为 `captureToolObservation()` 增加测试：
  - 输出 title 很泛时，`content` 仍应包含更有语义的信息
- 为 retrieval/injection 增加测试：
  - observation-only 场景下，返回/注入的文本应更像结论而不是 `tool: title`

**Step 2: Run tests to verify they fail**

Run:
- `bun test tests/runtime/tool-after.test.ts`
- `bun test tests/storage/retrieval-surface.test.ts`

Expected:
- 新测试失败

**Step 3: Write minimal implementation**

- 调整 observation `content` 的构造策略：
  - 优先融合高价值的 `output.summary`
  - 必要时再退回 `tool + title`
- 保持已有字段结构不变，避免大迁移

**Step 4: Run tests to verify they pass**

Run:
- `bun test tests/runtime/tool-after.test.ts`
- `bun test tests/storage/retrieval-surface.test.ts`

Expected:
- 新旧测试通过

**Step 5: Commit**

```bash
git add src/runtime/hooks/tool-after.ts src/storage/sqlite/memory-store.ts src/runtime/injection/system-context.ts tests/runtime/tool-after.test.ts tests/storage/retrieval-surface.test.ts
git commit -m "fix: strengthen observation content for retrieval"
```

### Task 3: idle summary re-entry guard

**Files:**
- Modify: `src/index.ts`
- Create: `tests/runtime/idle-summary-guard.test.ts`

**Step 1: Write the failing test**

- 模拟同一 `sessionID` 下两次并发 `session.idle`
- 目标行为：
  - 同一时刻只允许一个 summary pipeline 进入
  - 第二次调用应跳过或返回，不产生重复 summary

**Step 2: Run test to verify it fails**

Run: `bun test tests/runtime/idle-summary-guard.test.ts`

Expected:
- 新测试失败

**Step 3: Write minimal implementation**

- 在插件层加入 session 级 in-flight guard
- 只覆盖 `session.idle` summarization 主链
- 不引入新的外部锁系统

**Step 4: Run test to verify it passes**

Run: `bun test tests/runtime/idle-summary-guard.test.ts`

Expected:
- 新测试通过

**Step 5: Commit**

```bash
git add src/index.ts tests/runtime/idle-summary-guard.test.ts
git commit -m "fix: guard idle summary pipeline from reentry"
```

### Task 4: tighten decision and phase heuristics

**Files:**
- Modify: `src/memory/summary/aggregate.ts`
- Modify: `tests/summary/checkpoint-selection.test.ts`

**Step 1: Write the failing tests**

- 增加反例：
  - 普通带“生成/输出”的 observation 不应自动视为 `decision`
- 保留正例：
  - 明确“形成决策：...” 这类仍应切 checkpoint

**Step 2: Run test to verify it fails**

Run: `bun test tests/summary/checkpoint-selection.test.ts`

Expected:
- 新反例失败

**Step 3: Write minimal implementation**

- 收紧 decision 判定模式
- 优先依赖更明确的短语、结构或上下文位置
- 不引入模型判定

**Step 4: Run test to verify it passes**

Run: `bun test tests/summary/checkpoint-selection.test.ts`

Expected:
- 新旧测试通过

**Step 5: Commit**

```bash
git add src/memory/summary/aggregate.ts tests/summary/checkpoint-selection.test.ts
git commit -m "fix: tighten checkpoint decision heuristics"
```

### Task 5: full verification and docs

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `notes/opencode-memory.md` (workspace note)
- Modify: `logs/research-log.md` (workspace note)
- Modify: `notes/user-learning-profile.md` (workspace note)

**Step 1: Run full verification**

Run:
- `bun test`
- `bun run typecheck`
- `bun run build`

Expected:
- 全部通过

**Step 2: Update docs**

- README 增加当前质量增强说明
- architecture 标注当前仍是 plugin-internal pipeline
- 研究笔记记录修复结果和剩余边界

**Step 3: Commit**

```bash
git add README.md docs/architecture.md
git commit -m "docs: update memory quality-hardening status"
```
