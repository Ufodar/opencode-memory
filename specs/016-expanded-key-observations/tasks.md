# Tasks: Expanded Key Observations

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/016-expanded-key-observations/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 展开最新关键 observation (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加最新关键 observation 以多行形式展开的失败断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加较旧 observation 保持单行的失败断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 observation detail line 的整理函数
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，对少量关键 observation 追加 detail lines
- [x] T005 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/evidence-hints.ts`，补充 observation 展开所需的 evidence 文本辅助
- [x] T006 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 复用同样的展开策略 (Priority: P2)

### Tests for User Story 2

- [x] T007 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加关键 observation 展开的失败断言

### Implementation for User Story 2

- [x] T008 [US2] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts`，确保 compaction 走同样的 observation 展开策略
- [x] T009 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T010 运行 `bun run typecheck`
- [x] T011 运行 `bun run build`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T016 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
