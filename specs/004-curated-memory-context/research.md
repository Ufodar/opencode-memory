# Phase 0 Research: Curated Memory Context

## 决策 1：在 context builder 阶段做编译，不回写数据库

- **Decision**: 只在 `compiled-context.ts` / `compaction-context.ts` 做短文本编译，不改已落库的 summary / observation。
- **Why**:
  - 当前差距来自“注入给当前会话的文本不够像工作索引”
  - 数据库里的 semantic observation 已经比之前好很多
  - 直接改编译层可以最小化回归风险
- **Alternatives considered**:
  - 直接重写 summary 聚合逻辑：会把问题从“输出层”扩大到“存储层”
  - 再加模型调用压缩 context：会引入新成本和新不稳定性

## 决策 2：system context 和 compaction context 共享同一套裁剪规则

- **Decision**: 新增可复用的 deterministic curation helper，同时服务：
  - `buildSystemMemoryContext`
  - `buildCompactionMemoryContext`
- **Why**:
  - 两条链都在消费同一批 summary / observation
  - 如果规则分叉，很快会再次出现“preview 看起来一套、compaction 又是另一套”的漂移
- **Alternatives considered**:
  - 只先改 system context：短期更快，但后面 compaction 仍会保留长串摘抄

## 决策 3：优先压缩“每行的意义密度”，不是单纯硬截断

- **Decision**: 编译规则优先做：
  - 分句
  - 去重
  - 保留前 1 到 2 个高信息量片段
  - 最后再做长度截断
- **Why**:
  - 单纯按字符截断，仍然会保留很多无意义前缀
  - 当前真实输出的问题不是“字符太多”这么简单，而是“工作索引不够浓”
- **Alternatives considered**:
  - 纯 `slice(0, N)` 截断：实现最简单，但很难稳定提升阅读质量
