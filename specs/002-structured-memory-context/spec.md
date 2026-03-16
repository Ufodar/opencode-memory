# Spec: Structured Memory Context

**Spec ID**: `002-structured-memory-context`  
**Date**: 2026-03-16  
**Status**: Draft

## 背景

`001-evidence-aware-memory` 已经把 observation evidence 真正接进了：

- `memory_details`
- `memory_timeline`
- `system / compaction context`

但当前 `opencode-memory` 的注入文本仍然偏平：

- recent summaries
- recent observations

而 `claude-mem` 在这一层更强的地方，不只是“带了哪些数据”，而是：

- 它会先编译 context
- 再把：
  - timeline
  - summary
  - prior message
  - footer / token economics
  组合成更有结构的上下文

所以当前新的主线差距已经不是“有没有 evidence”，而是：

**当前会话真正看到的 memory context 还不够像一个编译过的工作索引。**

## 目标

把 `opencode-memory` 的注入层从“平铺 bullet list”推进到“结构化 memory context”。

第一阶段不复制 `claude-mem` 的全部输出格式，只补最关键的三层：

1. `summary section`
2. `timeline section`
3. `resume guidance section`

## 非目标

- 不复制 `claude-mem` 的完整 terminal 呈现
- 不加入颜色、表格、复杂 markdown 装饰
- 不做 transcript prior message 回接
- 不引入新的 retrieval 工具
- 不引入 token economics 展示

## 用户故事

### User Story 1

作为下一轮进入会话的 agent，  
我希望注入的 memory context 不是一串平铺 bullet，  
而是先告诉我：

- 近期完成了什么
- 当前锚点周围发生了什么
- 下一步该怎么恢复

这样我能更快进入工作状态。

### User Story 2

作为调试者，  
我希望 `memory_context_preview` 能预览和 system transform 一致的结构化上下文，  
这样我能判断注入内容是否过平、过乱或过长。

## 功能要求

### FR1

system context 必须从单一平铺列表升级为结构化 sections，至少包含：

- `[MEMORY SUMMARY]`
- `[MEMORY TIMELINE]`
- `[RESUME GUIDE]`

### FR2

summary section 必须优先显示最近 summary，保留：

- outcome
- next step

### FR3

timeline section 必须显示最相关 observation / summary 片段，但数量受 budget 控制。

### FR4

timeline observation item 必须继续保留最小 evidence hint：

- `files: ...`
- `cmd: ...`

### FR5

resume guide 必须是 deterministic 规则生成，不依赖模型调用。

### FR6

`memory_context_preview` 的输出结构必须与实际 system injection 一致。

### FR7

compaction context 可以保持现有风格，不强制完全与 system context 同构；本轮重点先落 system context。

## 成功标准

1. `memory_context_preview` 的输出不再只是：
   - summaries
   - observations
   两段平铺列表
2. 真实宿主 smoke 继续通过
3. character budget 仍然受控
4. 新增结构不会让 retrieval-only 请求重新污染正式 request history
