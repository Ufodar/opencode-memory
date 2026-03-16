# 研究记录：Context Drilldown Intro

## `claude-mem` 对照

`claude-mem` 的 Context Index 在工具说明前，会先用一行导语告诉模型：

- 当需要更细实现细节、理由、调试上下文时，再往下钻

这让后面的工具说明更像“下一步动作”，不是直接堆在 header 里。

## 当前仓现状

`opencode-memory` 现在已经有：

- 当前 index 是什么
- 当前 index 覆盖什么
- 当前 index 通常够用
- 默认先信 index
- 三种 memory 工具说明

所以当前缺的不是工具能力，而是工具说明前缺一条过渡句。

## 本轮约束

- 只改 system context 的工具说明入口
- 不改工具语义
- 不改 compaction context
