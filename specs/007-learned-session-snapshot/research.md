# Phase 0 Research: Learned Session Snapshot

## 决策 1：`Learned` 只来自 latest summary 覆盖的 observation

- **Decision**: `Learned` 只基于 latest summary 的 `observationIDs` 对应 observation 编译。
- **Why**:
  - 这样才能保证 `Learned` 不是凭空编的
  - 也能和 `Completed` 区分开
- **Alternatives considered**:
  - 直接从 `outcomeSummary` 再切一刀：很容易和 `Completed` 重复

## 决策 2：不改数据库 schema

- **Decision**: 不新增 `learned` 字段，也不回写数据库。
- **Why**:
  - 当前差距在 context builder 字段组织
  - 不是 summary 存储层先天缺字段

## 决策 3：system / compaction 共用同一套 learned 编译规则

- **Decision**: `Learned` 的短文本编译在 system / compaction 两边共用。
- **Why**:
  - 避免再次出现两边风格漂移
