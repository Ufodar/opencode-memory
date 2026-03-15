# opencode-memory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 初始化一个独立的 MIT 开源仓库，作为面向 OpenCode 的通用工作记忆插件底座。

**Architecture:** 先建立独立 git 仓、OpenCode plugin 最小骨架、observation/summary 类型与核心文档；第一版以 `tool.execute.after`、`experimental.chat.system.transform` 和分层检索占位为主，不引入外部 worker。

**Tech Stack:** TypeScript, OpenCode Plugin SDK, Bun-compatible runtime

---

### Task 1: 初始化仓库基础文件

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`

**Step 1: 创建开源仓基础元数据**

- 明确仓库名、MIT 许可、构建脚本和 OpenCode plugin hooks。

**Step 2: 写 README**

- 说明项目定位、边界、结构和第一阶段目标。

**Step 3: 写 MIT License**

- 使用仓库作者 `Ufodar`。

### Task 2: 建立最小插件骨架

**Files:**
- Create: `src/index.ts`
- Create: `src/services/logger.ts`
- Create: `src/config/defaults.ts`

**Step 1: 建立最小插件入口**

- 暴露：
  - `chat.message`
  - `event`
  - `tool.execute.after`
  - `experimental.chat.system.transform`
  - `tool.memory_search`
  - `tool.memory_details`

**Step 2: 加日志占位**

- 保证后续调试有稳定入口。

### Task 3: 建 observation / summary 核心类型

**Files:**
- Create: `src/memory/observation/types.ts`
- Create: `src/memory/observation/candidate.ts`
- Create: `src/memory/summary/types.ts`
- Create: `src/runtime/hooks/tool-after.ts`
- Create: `src/runtime/injection/system-context.ts`

**Step 1: 定义 observation 结构**

- 约束：
  - action
  - input/output summary
  - retrieval
  - trace

**Step 2: 定义候选筛选规则**

- 第一版用简单规则，不依赖大模型。

**Step 3: 建立 system context builder**

- 让注入点先有稳定输入结构。

### Task 4: 建最小检索工具面

**Files:**
- Create: `src/tools/memory-search.ts`
- Create: `src/tools/memory-details.ts`

**Step 1: 先建占位工具**

- 不追求第一天就做完真正检索。

**Step 2: 保持工具名与分层方向一致**

- 避免回到单一 `memory` 巨工具。

### Task 5: 建文档

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/roadmap.md`

**Step 1: 写机制角色对照**

- 明确 `claude-mem` 角色与 OpenCode 等价点。

**Step 2: 写路线图**

- 把 observation、summary、injection、retrieval 分期。
