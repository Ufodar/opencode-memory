# opencode-continuity

OpenCode 的通用 memory continuity 插件底座。

## 定位

这个项目是一个独立的 MIT 开源仓库，方向是：

- 面向 OpenCode
- 专注 memory continuity
- 逼近 `claude-mem` 的核心机制角色
- 不直接夹带业务领域逻辑

第一阶段只做通用能力：

- observation 级采集
- summary 聚合
- system/background 注入
- 分层检索

第一阶段不做：

- 标书或其他业务特化 memory
- 团队知识库
- 重型外部 worker
- 复杂 timeline / reranking

## 设计原则

1. 角色等价，不做平台照搬
2. 先 observation，再 summary
3. 先通用 continuity substrate，再叠业务层
4. 保持 MIT 独立仓，避免混入 AGPL 代码

## 仓库结构

```text
src/
  index.ts
  config/
  runtime/
    hooks/
    injection/
  memory/
    observation/
    summary/
  storage/
  tools/
  services/
docs/
  architecture.md
  roadmap.md
  plans/
```

## 当前状态

当前仓库已完成：

- 独立 git 仓库初始化
- MIT 许可
- OpenCode plugin 最小骨架
- 核心 observation / summary 类型
- SQLite observation 持久化
- request anchor 持久化
- deterministic summary aggregation
- `memory_search` / `memory_details` 已支持 summary-first 检索与 mixed details
- 第一版架构和路线图文档

下一步建议优先实现：

1. summary ranking / scope 控制
2. 更细的 request window 切分
3. 注入层的去重与 token 预算
4. 再评估是否需要轻量外部 worker

## 致谢

这个项目的机制设计参考了：

- `opencode-mem`
- `claude-mem`

当前仓库目标是吸收其机制角色，而不是复制其全部代码结构。
