# Memory Contracts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 runtime 和 tool 层对具体 SQLite 实现的直接依赖，收紧成面向 memory 领域的最小 contracts。

**Architecture:** 现有 `SQLiteMemoryStore` 已经把 SQLite 持久化层拆开，但上层仍直接引用 SQLite 具体类与 SQLite 目录内的类型。下一步把 memory 的查询结果类型和最小 store interfaces 提升为 backend-agnostic contracts，让 runtime / injection / tools 依赖领域 contracts，而不是依赖具体 SQLite 名字。

**Tech Stack:** TypeScript, Bun, OpenCode plugin runtime, SQLite-backed persistence

---

### Task 1: 提升 memory 结果类型为领域 contracts

**Files:**
- Create: `src/memory/contracts.ts`
- Modify: `src/storage/sqlite/types.ts`
- Modify: `src/storage/sqlite/memory-store.ts`
- Test: `tests/tools/retrieval-tools.test.ts`

**Step 1: 写失败测试**

让 retrieval tools 的测试改为从 `src/memory/contracts.ts` 引类型和最小接口。

**Step 2: 运行测试确认失败**

Run: `bun test tests/tools/retrieval-tools.test.ts`
Expected: FAIL with missing module or missing exported type

**Step 3: 写最小实现**

- 新建 `src/memory/contracts.ts`
- 把 `MemorySearchRecord`
- `MemoryObservationDetailRecord`
- `MemoryDetailRecord`
- `MemoryTimelineItem`
- 以及 runtime/tools 需要的最小 store interfaces 提升到这里

**Step 4: 运行测试确认通过**

Run: `bun test tests/tools/retrieval-tools.test.ts`
Expected: PASS

### Task 2: 让 runtime / injection / tools 依赖 contracts 而不是 SQLite 具体类

**Files:**
- Modify: `src/runtime/injection/select-context.ts`
- Modify: `src/tools/memory-search.ts`
- Modify: `src/tools/memory-details.ts`
- Modify: `src/tools/memory-timeline.ts`
- Modify: `src/runtime/pipelines/idle-summary-pipeline.ts`
- Test: `tests/runtime/select-context.test.ts`
- Test: `tests/runtime/idle-summary-pipeline.test.ts`

**Step 1: 写失败测试**

将相关测试中的类型断言改为 contracts 中的最小接口。

**Step 2: 运行测试确认失败**

Run: `bun test tests/runtime/select-context.test.ts tests/runtime/idle-summary-pipeline.test.ts`
Expected: FAIL because the contracts are not fully wired

**Step 3: 写最小实现**

- `select-context` 只依赖注入所需接口
- `memory_search / memory_details / memory_timeline` 只依赖各自最小接口
- `idle-summary-pipeline` 继续只依赖最小 pipeline store 接口

**Step 4: 运行测试确认通过**

Run: `bun test tests/runtime/select-context.test.ts tests/runtime/idle-summary-pipeline.test.ts`
Expected: PASS

### Task 3: 全量回归与文档同步

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `notes/opencode-memory.md`
- Modify: `logs/research-log.md`
- Modify: `notes/user-learning-profile.md`

**Step 1: 全量验证**

Run: `bun test && bun run typecheck && bun run build`
Expected: all pass

**Step 2: 文档更新**

- README 说明 contracts 的长期角色
- architecture 说明 backend-agnostic boundary 已开始形成
- 研究笔记记录这一步不是新功能，而是上层解耦

**Step 3: 提交**

```bash
git add README.md docs/architecture.md docs/plans/2026-03-15-memory-contracts-implementation.md src tests
git commit -m "refactor: introduce backend-agnostic memory contracts"
```
