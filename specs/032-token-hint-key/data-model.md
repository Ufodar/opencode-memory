# Data Model: Token Hint Key

## 不新增持久化实体

继续复用：

- 已有 `Tokens: Read ~X | Work ~Y`

## 新增的临时输出

### TokenHintKey

- 输出：
  - `[TOKEN KEY] Read=current reading cost | Work=prior work investment`

## 约束

- 只作用于 system context header
- 不改 token hint 本身的格式
- 不进入 compaction context
