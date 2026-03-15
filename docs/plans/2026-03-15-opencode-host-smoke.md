# 2026-03-15 OpenCode 宿主 smoke / integration 验证

## 目标

验证 `opencode-continuity` 不只是单元测试通过，而是真的能在本机 OpenCode 宿主中：

1. 加载本地 plugin
2. 暴露 continuity tools
3. 在真实 `read` 后写入 observation
4. 在 `session.idle` 后写入 summary
5. 在后续请求里通过 `memory_search -> memory_timeline -> memory_details` 找回 continuity

## 测试工作区

- 工作区：`/Users/storm/Documents/code/study_in_happy/downloads/opencode-continuity-host-smoke`
- 局部配置：`.opencode/opencode.json`
- plugin 入口：`file:///Users/storm/Documents/code/study_in_happy/projects/opencode-continuity/dist/index.js`

## 真实验证结论

### 已确认通过

1. OpenCode 会从测试工作区的 `.opencode/opencode.json` 加载本地 plugin。
2. 插件 tools 会真实出现在 tool surface：
   - `memory_search`
   - `memory_timeline`
   - `memory_details`
3. 第一轮请求成功触发：
   - `read brief.txt`
   - `read checklist.md`
4. continuity SQLite 真正落库：
   - `request_anchors = 1`
   - `observations = 2`
   - `summaries = 1`
5. 第二轮继续同一 session 后，agent 成功调用：
   - `memory_search`
   - `memory_timeline`
   - `memory_details`
6. `memory_details` 能回到 summary 覆盖的 observation 详情，说明 retrieval 主链在真实宿主里成立。

### 暴露出的宿主变量

#### 1. `--model` 必须显式写成 `provider/model`

全局配置里的 `model = "Kimi-K2.5"` 对 `opencode run` 不够，真实 CLI 启动需要显式：

- `--model my-company/Kimi-K2.5`

否则会触发 `ProviderModelNotFoundError`。

#### 2. `--session` 继续会话时，必须同时带 `--dir`

如果只传 `--session`，OpenCode 会按当前 shell 的 cwd 建实例。  
这会导致测试工作区的局部 `.opencode/opencode.json` 不再参与加载，最终出现：

- continuity plugin 没有加载
- `memory_search` 被模型视为 unavailable tool

因此继续同一会话时，必须这样跑：

- `--session <id> --dir <workspace>`

#### 3. 路径提示要钉死到相对路径或当前工作区

第一轮如果只说“读取 brief.txt”，模型会漂移到错误绝对路径。  
更稳的 smoke prompt 是：

- 明确要求使用 `./brief.txt`
- 明确要求使用 `./checklist.md`
- 强调“不要读取任何其他路径”

#### 4. 全局 MCP 会显著污染宿主 smoke

这次真实验证里，global config 里的 MCP 集合会导致：

- `resolveTools` 很慢
- 多个无关 MCP startup timeout
- 不相关 stderr 噪声很多

这不是 `opencode-continuity` 的 bug，但会降低 smoke 结果的可读性。

## 当前判断

这轮真实宿主验证已经足够证明：

- `opencode-continuity` 在真实 OpenCode 里可以形成完整 continuity 主闭环
- 当前更大的集成噪声来自：
  - OpenCode 宿主的全局配置
  - model 指定方式
  - session continuation 时的 directory 变量

也就是说，当前系统已经从“本地可跑”推进到“真实宿主可工作”。

## 下一步建议

如果继续做更系统的 integration 验证，优先级应是：

1. 做一套最小宿主配置，只保留 provider 和本地 plugin
2. 减少 global MCP 对 smoke 的干扰
3. 在最小宿主下补：
   - system transform 观测
   - compaction continuity 观测

## 最小宿主配置 smoke 追加结果

### 这一步保留了什么

- 测试工作区本地 plugin：
  - `.opencode/opencode.json`
- provider：
  - `my-company`
- 显式模型参数：
  - `--model my-company/Kimi-K2.5`
- 隔离 HOME：
  - `/Users/storm/Documents/code/study_in_happy/downloads/opencode-continuity-host-smoke/.tmp-home-minimal`

### 这一步拿掉了什么

- 全局 `mcp`
- 全局其他 plugin
- 与 continuity 无关的宿主噪声

### 安全处理

- 正式全局配置已先备份：
  - `/Users/storm/.config/opencode/opencode.json.bak-20260315-094135-minimal-host-smoke`
- 未修改正式全局配置本身
- 最小宿主配置文件单独放在：
  - `/Users/storm/Documents/code/study_in_happy/downloads/opencode-continuity-host-smoke/.tmp-opencode-minimal.json`

### 第一轮：写入链

- 命令环境：
  - `HOME=.tmp-home-minimal`
  - `OPENCODE_CONFIG=.tmp-opencode-minimal.json`
  - `--dir` 指向 smoke 工作区
- 第一次尝试失败，不是 continuity bug，而是模型把 `./brief.txt` 漂移成了工作区外路径，触发：
  - `external_directory`
- 修正方式：
  - 把 shell 当前目录切到 smoke 工作区
  - prompt 里直接钉死两个绝对路径
- 修正后结果成立：
  - `read brief.txt` 成功
  - `read checklist.md` 成功
  - plugin 捕获两条 observation
  - plugin 捕获一条 summary

### 第二轮：回查链

- 在同一 session 下继续，并显式带：
  - `--session <id>`
  - `--dir <workspace>`
- 结果成立：
  - `memory_search` 成功返回 summary
  - `memory_timeline` 成功围绕该 summary 建时间线
  - `memory_details` 成功下钻到两条 observation

### 当前判断更新

- “最小宿主配置”这条线已经通过真实宿主验证
- 这说明之前 smoke 里的大量噪声，确实主要来自全局 MCP 和全局宿主配置，而不是 `opencode-continuity` 自己
- 当前更值得继续观察的宿主变量变成：
  1. prompt 是否会把相对路径漂移到工作区外
  2. `--session` 是否始终和 `--dir` 一起传入

## 追加测试：控制变量 smoke vs 更松的鲁棒性 prompt

### 测了什么

这轮把测试正式拆成两类：

1. 控制变量 smoke
   - 目标：只验证 continuity 主闭环
2. 更松的鲁棒性 prompt
   - 目标：观察 prompt 不再钉死绝对路径后，宿主里的行为会不会立刻失稳

### 控制变量 smoke 结果

- 环境：
  - 最小宿主配置
  - 隔离 HOME
  - prompt 里直接钉死两个绝对路径
- 结果：
  - `request_anchors = 1`
  - `observations = 2`
  - `summaries = 1`
  - 第二轮 `memory_search -> memory_timeline -> memory_details` 也成立

### 更松的鲁棒性 prompt 结果

- 环境：
  - 仍然是最小宿主配置
  - 仍然是隔离 HOME
  - prompt 只写：
    - `读取 brief.txt 和 checklist.md`
- 结果：
  - 这轮同样成功
  - 也生成了：
    - `2` 条 observation
    - `1` 条 summary

### 对“路径漂移”这个变量的最新判断

- 它不是稳定可复现现象
- 目前更像是：
  - 某次运行里模型偶发选错了 tool 参数
- 这意味着：
  - 它不适合被当成当前 continuity 主线问题
  - 也不适合被当成当前最值得投入的宿主 bug

### 这轮测试真正说明了什么

- `opencode-continuity` 的 continuity 主闭环，在最小宿主配置下是稳定成立的
- 即使 prompt 放松到文件名级别，这轮也没有立刻塌

### 这轮测试没有说明什么

- 这并不等于“模型永远不会选错路径”
- 它只说明：
  - 当前我们还没有把“路径选错”稳定复现成一个值得优先处理的问题

## 追加结果：runner 报告层验证

### 这一步新增了什么

- runner 现在不只输出 console JSON
- 还会在 workspace 下额外写出两份报告：
  - `host-smoke-<timestamp>-report.json`
  - `host-smoke-<timestamp>-report.md`

### 这次真实结果

- 控制变量测试通过：
  - 写入链成立
  - 回查链成立
  - SQLite 里有：
    - `request_anchors = 1`
    - `observations = 2`
    - `summaries = 1`
- 更松的参考测试失败：
  - `read` 没成功
  - 因此没有 observation / summary 落库

### 这次变化为什么重要

- 之前如果出现“主闭环通过，但参考场景失败”，需要人工读 JSONL 才知道
- 现在直接看 `report.md`，就能第一眼知道：
  - 主闭环是否成立
  - 是卡在写入链还是回查链
  - 每种模式对应的证据文件在哪

### 当前判断更新

- 当前 runner 已经具备：
  - 真实宿主回归
  - 机器可读输出
  - 人类可读摘要
- 这意味着后面如果继续改 continuity 主逻辑，先看 `report.md` 就足够判断“这次改动有没有把主闭环打坏”
