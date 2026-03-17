# Language-Neutral Memory Core Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the most visible Chinese-only production heuristics so `opencode-memory` behaves like a language-neutral OSS plugin by default.

**Architecture:** Keep the existing worker, storage, and context-builder architecture intact. Only adjust three production control points: decision-signal detection, retrieval-only prompt detection, and model output language policy. Preserve current Chinese workflows through explicit configuration rather than hard-coded defaults.

**Tech Stack:** TypeScript, Bun, OpenCode plugin runtime

---

### Task 1: Add failing tests for English decision signals

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/checkpoint-selection.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/phase.ts`

**Step 1: Write the failing test**

Add tests that prove:
- `Decision: produce a gap checklist before drafting` is treated as a decision signal
- `Next step: validate the smoke report` is treated as a decision-like observation

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/summary/checkpoint-selection.test.ts
```

Expected: FAIL because current regex only recognizes Chinese-first signals.

**Step 3: Write minimal implementation**

Expand decision-signal detection in:
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/memory/observation/phase.ts`

Keep generic output wording non-decision.

**Step 4: Run test to verify it passes**

Run the same test file and confirm green.

**Step 5: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add tests/summary/checkpoint-selection.test.ts src/memory/observation/phase.ts
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "feat: add language-neutral decision signals"
```

### Task 2: Add failing tests for English retrieval-only prompt detection

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/chat-message.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/chat-message.ts`

**Step 1: Write the failing test**

Add tests that prove:
- English memory lookup-only prompts are skipped
- English preview-only prompts are skipped
- Mixed prompts with real work intent are still kept

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/runtime/chat-message.test.ts
```

Expected: FAIL because current English rules are too narrow.

**Step 3: Write minimal implementation**

Broaden English retrieval-only heuristics in:
- `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/hooks/chat-message.ts`

Do not remove the existing Chinese rules.

**Step 4: Run test to verify it passes**

Run the same test file and confirm green.

**Step 5: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add tests/runtime/chat-message.test.ts src/runtime/hooks/chat-message.ts
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "feat: broaden retrieval-only prompt detection"
```

### Task 3: Add failing tests for configurable output language

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/summary/model-summary.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/observation/model-observation.test.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/model-summary.ts`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/model-observation.ts`
- Create or Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/services/ai/output-language.ts`

**Step 1: Write the failing test**

Add tests that prove:
- default prompt requires English output
- `OPENCODE_MEMORY_OUTPUT_LANGUAGE=zh` requires Chinese output
- weak next step filtering drops English filler like `continue working`

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts
```

Expected: FAIL because current prompts require Chinese by default and weak-next-step filtering is Chinese-only.

**Step 3: Write minimal implementation**

Implement a shared output-language helper and switch summary/observation prompts to use it.

**Step 4: Run test to verify it passes**

Run the same two test files and confirm green.

**Step 5: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts src/services/ai/model-summary.ts src/services/ai/model-observation.ts src/services/ai/output-language.ts
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "feat: make model output language configurable"
```

### Task 4: Regression verification and docs

**Files:**
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- Modify: `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`

**Step 1: Run targeted verification**

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun test tests/summary/checkpoint-selection.test.ts tests/runtime/chat-message.test.ts tests/summary/model-summary.test.ts tests/observation/model-observation.test.ts
```

**Step 2: Run type/build verification**

```bash
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun run typecheck
cd /Users/storm/Documents/code/study_in_happy/projects/opencode-memory && bun run build
```

**Step 3: Update docs**

Document:
- language-neutral heuristics
- configurable output language
- remaining OSS cleanup gap

**Step 4: Commit**

```bash
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory add README.md docs/architecture.md
git -C /Users/storm/Documents/code/study_in_happy/projects/opencode-memory commit -m "docs: record language-neutral memory core"
```
