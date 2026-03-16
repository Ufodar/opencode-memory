# Phase 0 Research: Fielded Session Snapshot

## 决策 1：只编译 latest summary，不做多 summary 聚合

- **Decision**: 本轮只把最新一条 summary 变成 session snapshot。
- **Why**:
  - 当前要解决的是“最近一轮工作一眼能否看懂”
  - 多 summary 聚合已经由 `MEMORY SUMMARY` 在做，不需要这一轮重复
- **Alternatives considered**:
  - 把所有 summary 都拆字段：范围太大，会把本轮从“当前快照”扩大成“历史回顾系统”

## 决策 2：优先用现有字段编译，不新增 summary schema

- **Decision**: snapshot 直接基于：
  - `requestSummary`
  - `outcomeSummary`
  - `nextStep`
- **Why**:
  - 当前差距在 context builder 组织方式
  - 不是 summary 存储层先天缺字段
- **Alternatives considered**:
  - 新增 `investigated/learned/completed` 字段并回写数据库：太早，会把展示问题扩大成数据模型重构

## 决策 3：把 fallback 恢复方向当成 snapshot 的一部分

- **Decision**: `nextStep` 缺失时，也要给 snapshot 一个 deterministic fallback。
- **Why**:
  - 当前很多 summary 没有 `nextStep`
  - 如果 snapshot 只在有 `nextStep` 时成立，会很脆
- **Alternatives considered**:
  - `nextStep` 缺失时直接留空：会让 snapshot 失去恢复价值
