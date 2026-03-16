# Research: Semantic Memory Records

## 决策 1：先提升 deterministic `read` observation，而不是先强制上模型

**Decision**: 优先从 `read` 工具的 `<content>...</content>` 里提取高信息量文本，生成 deterministic semantic observation。  
**Rationale**:
- 真实宿主 `read` 输出已经带正文
- 当前最差的体验正是 preview 里出现 `read: 路径`
- 先做 deterministic 就能让主闭环明显提升  
**Alternatives considered**:
- 直接依赖 observation model：提升可能更大，但会把主闭环绑到额外 API 上，顺序不对

## 决策 2：summary / resume 复用 observation 结果，不新增第二套语义摘要器

**Decision**: summary 和 resume 先继续复用 observation 的 `content / output.summary`。  
**Rationale**:
- 同一轮改动可以同时改善 capture、summary、preview
- 避免 capture 和 summary 文字风格分叉  
**Alternatives considered**:
- 为 summary 单独再做一个 deterministic 语义聚合器：成本更高，也更容易重复

## 决策 3：保留 observation model，但它只能是增强层

**Decision**: 继续支持 `OPENCODE_MEMORY_OBSERVATION_*` 配置，但当模型失败、未配置、超时时必须无损回退。  
**Rationale**:
- 仓里已有 `model-observation.ts`
- 这一层确实有助于继续逼近 `claude-mem` 的 observation 质量
- 但不能让 preview、summary、resume 的基本可用性依赖模型  
**Alternatives considered**:
- 暂时不暴露 observation model：实现更简单，但会把已经存在的能力继续藏在代码里

## 决策 4：这一轮不做向量层，不做新 retrieval tool

**Decision**: 只改 memory record 的语义质量，不改 retrieval surface。  
**Rationale**:
- 当前主线差距在语义质量，不在工具数量
- retrieval 工具已经足够证明效果  
**Alternatives considered**:
- 顺手增强 search ranking：会偏航
