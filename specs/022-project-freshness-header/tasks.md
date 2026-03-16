# Tasks: Project Freshness Header

**Input**: 设计文档来自 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/specs/022-project-freshness-header/`
**Prerequisites**: `spec.md`、`plan.md`、`research.md`、`data-model.md`

## Phase 1: User Story 1 - system context 头部显示项目名和生成时间 (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T001 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加 project freshness header 的失败断言
- [x] T002 [US1] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/system-context.test.ts` 增加“缺少 projectPath 时仍稳定输出”的失败断言

### Implementation for User Story 1

- [x] T003 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/curated-context-text.ts`，新增 project/freshness header 构造函数
- [x] T004 [US1] 修改 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compiled-context.ts`，在 system context 头部插入 project freshness header
- [x] T005 [US1] 运行 `bun test tests/runtime/system-context.test.ts`

## Phase 2: User Story 2 - compaction context 不引入 freshness header (Priority: P2)

### Tests for User Story 2

- [x] T006 [US2] 在 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/tests/runtime/compaction-context.test.ts` 增加 compaction 不包含 `Generated:` 的失败断言

### Implementation for User Story 2

- [x] T007 [US2] 确认 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/src/runtime/injection/compaction-context.ts` 不引入 project freshness header
- [x] T008 [US2] 运行 `bun test tests/runtime/compaction-context.test.ts`

## Phase 3: Regression & Documentation

- [x] T009 运行 `bun run typecheck`
- [x] T010 运行 `bun run build`
- [x] T011 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/README.md`
- [x] T012 更新 `/Users/storm/Documents/code/study_in_happy/projects/opencode-memory/docs/architecture.md`
- [x] T013 更新 `/Users/storm/Documents/code/study_in_happy/notes/opencode-memory.md`
- [x] T014 更新 `/Users/storm/Documents/code/study_in_happy/logs/research-log.md`
- [x] T015 更新 `/Users/storm/Documents/code/study_in_happy/notes/user-learning-profile.md`
