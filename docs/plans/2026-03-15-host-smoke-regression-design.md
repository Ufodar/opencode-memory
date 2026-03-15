# Host Smoke Regression Design

> 目标：把已经人工验证过的真实 OpenCode 宿主 smoke，收成一个可重复跑的回归脚本。

## 这一步要解决什么

现在 `opencode-continuity` 已经证明：

- 在最小宿主配置下能加载 plugin
- 能写 observation / summary
- 能通过 `memory_search -> memory_timeline -> memory_details` 回查

但这些验证还停留在人工命令和人工读日志阶段。  
只要后面继续改 continuity 逻辑，就需要反复手工重跑，成本高，也容易漏。

## 推荐方案

### 方案 A：只写文档，不写脚本

- 优点：
  - 最快
- 缺点：
  - 仍然靠人手工跑
  - 后续回归成本高
  - 不能快速回答“这次改动有没有把真实宿主闭环打坏”

### 方案 B：直接写一个一体化大脚本

- 优点：
  - 一次命令全跑完
- 缺点：
  - 很快会把：
    - 配置生成
    - 宿主调用
    - JSONL 分析
    - SQLite 校验
    全揉在一起
  - 难测、难维护

### 方案 C：两层结构（推荐）

1. 先做一层纯分析逻辑
   - 负责解析 JSONL
   - 判断 observation / summary / retrieval 是否成立
2. 再做一层真实 runner
   - 生成最小宿主配置
   - 调 `opencode run`
   - 读 SQLite
   - 汇总结果

推荐原因：

- 纯分析层可以先做单元测试
- runner 负责真实宿主集成
- 结构更贴长期目标，不会再次把“测试逻辑”和“宿主编排”糊成一团

## 边界

### 这一步会做

- 一个可执行的 host smoke runner
- 一个最小宿主配置生成器
- 两类测试模式：
  - control
  - robust
- 一组用于判断 pass/fail 的纯函数测试

### 这一步不会做

- CI 集成
- 复杂多 provider 适配
- 自动修复宿主问题
- 把所有人工 smoke 场景都脚本化

## 成功标准

1. 一条命令能跑 control smoke
2. 能输出：
   - session id
   - SQLite counts
   - write-chain 是否成立
   - retrieval-chain 是否成立
3. robust 模式也能单独跑
4. 分析逻辑有单元测试

## 实现后补充

- 最终落地成：
  - `src/testing/host-smoke.ts`
  - `src/testing/run-host-smoke.ts`
  - `bun run smoke:host`
- control 模式的 retrieval 没有继续使用“一条 prompt 逼模型自己做完三步”，而是拆成：
  1. `memory_search`
  2. `memory_timeline`
  3. `memory_details`
- 这样做的原因是：
  - control smoke 要测的是 continuity 工具链是否成立
  - 不是测模型是否愿意一次完成长流程指令
- 最新真实验证结果：
  - `--mode both` 已通过
