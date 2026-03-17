# Language-Neutral Context Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make deterministic snapshot/resume fallback actions follow the memory output language policy so default OSS output is English while explicit Chinese workflows still work.

**Architecture:** Reuse the output-language policy introduced in `063`. Only touch deterministic context text builders and their tests; do not change context structure or translate stored memory payloads.

**Tech Stack:** TypeScript, Bun, OpenCode plugin runtime

---

### Task 1: Add failing tests for default English fallback actions

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts`

**Step 1: Write the failing test**

Add tests showing that when no explicit `nextStep` exists, default fallback strings should become:
- `Continue from ...`
- `Continue with ...`

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

Expected: FAIL because current fallback text still contains `继续从...开始` and `继续处理...`.

**Step 3: Write minimal implementation**

Modify:
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`

Use shared output-language policy.

**Step 4: Run test to verify it passes**

Run the same two test files and confirm green.

**Step 5: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts src/runtime/injection/curated-context-text.ts
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "feat: add language-neutral context actions"
```

### Task 2: Add failing tests for explicit Chinese fallback policy

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts`

**Step 1: Write the failing test**

Add tests that set `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh` and prove the Chinese fallback strings are still preserved.

**Step 2: Run test to verify it fails**

Run the same targeted test files if necessary and confirm the new assertions fail before implementation.

**Step 3: Write minimal implementation**

Ensure deterministic fallback text branches on `OPENCODE_MEMORY_OUTPUT_LANGUAGE`.

**Step 4: Run test to verify it passes**

Run the same tests and confirm green.

**Step 5: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts src/runtime/injection/curated-context-text.ts
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "feat: preserve chinese context fallback policy"
```

### Task 3: Regression verification and docs

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

**Step 1: Run targeted verification**

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/runtime/system-context.test.ts tests/runtime/compaction-context.test.ts
```

**Step 2: Run type/build verification**

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun run typecheck
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun run build
```

**Step 3: Update docs**

Document that deterministic context actions now follow `OPENCODE_MEMORY_OUTPUT_LANGUAGE`.

**Step 4: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add README.md docs/architecture.md
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "docs: record language-neutral context actions"
```
