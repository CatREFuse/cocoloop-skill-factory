# 调研阶段指南

当前版本阶段声明：
本阶段只产出需求文档和调研结论，不直接落地脚本、模板或 Skill 包。

## 目标

调研阶段的目标是把用户的模糊想法收束成一份可以进入设计阶段的稳定需求结果。
这一阶段关注的是问题定义，不急着写最终产物。

## 进入条件

满足任一条件即可进入本阶段：

- 用户想创建新 Skill
- 用户想升级已有 Skill
- 用户想评估现成 Skill 是否可复用
- 用户只知道想解决的问题，还没有明确平台或实现方向

命令路径约定：

- 如果当前目录是 `cocoloop-skill-factory/`，使用 `python3 utils/cli/<script>.py ...`
- 如果当前目录是工作区根目录，使用 `python3 cocoloop-skill-factory/utils/cli/<script>.py ...`

## 开场动作

1. 先说明 `skill-factory` 能做什么，以及当前会从需求调研开始。
2. 浏览当前工作区、仓库和用户给出的上下文，找已有约束。
3. 运行 `python3 utils/cli/detect-environment.py`，如果当前目录不在 skill 根目录，就改用 `python3 cocoloop-skill-factory/utils/cli/detect-environment.py`，拿到当前环境线索。
4. 判断外部 `brainstorming` 是否可用；可用就优先复用，不可用就回退到 `sub-skills/brainstorm/SKILL.md`。
5. 把问答和阶段结论整理成文档笔记，供设计阶段引用。

## 对话节奏

### 分步询问：一次只推进一个问题（强制要求）

**严禁一次性列出所有问题等待用户回答。**

- 每一轮只问一个关键问题
- 必须得到用户回答后，才能决定并询问下一个问题
- 如果某个问题涉及多个子维度，拆成连续轮次推进
- 禁止在同一次回复中抛出多个问题清单

**为什么这样做：**
一次性抛出所有问题会让用户感到压力，导致回复质量下降或选择性忽略部分问题。分步询问可以保持对话的连贯性和质量。

### 标准提问格式

#### 选项类问题（3-5个选项）

使用有序列表编码，便于用户直接回复数字：

```
请选择您的目标平台：

1. **claude code** - 适合日常开发任务
2. **codex** - 适合大规模代码生成
3. **openclaw** - 适合浏览器自动化
4. **copaw** - 适合企业工作流
5. **其他** - 请说明

推荐：**claude code**（当前环境匹配）

请回复选项编号（1-5）：
```

#### 路径选择类问题（2-3个方向）

```
请选择实现路径：

1. **复用现成 Skill** → 推荐
   - 适合：需求与现有 Skill 高度重合
   - 优势：快速交付

2. **基于现成改造**
   - 适合：需求部分重合

3. **从零设计**
   - 适合：需求独特

请回复 1、2 或 3：
```

#### 开放式问题

```
请描述核心问题是什么？

💡 提示：从「谁在什么场景下遇到什么痛点」来描述

请直接输入：
```

#### 确认类问题

```
当前已确认：
- 目标平台：claude code
- 核心问题：自动化代码格式化

是否继续？

1. ✅ 确认并继续
2. ⏸️ 暂停
3. 📝 修改

请回复 1、2 或 3：
```

### 先发散，再收敛

前半段让用户把目标、痛点、理想效果和顾虑讲出来。
后半段把范围缩回到当前版本真正要做的内容。

### 维持阶段感

在阶段内持续向用户说明三件事：

- 已经确认了什么
- 还缺什么
- 下一轮要确认什么

## 必采集信息

进入设计阶段前，至少要采集到下面这些字段：

### 任务目标

- 这个 Skill 要解决什么问题
- 谁会用它
- 在什么场景里使用

### 目标平台

- 主平台是什么
- 是否要同时覆盖多个平台
- 如果用户说“当前环境就是目标平台”，用环境检测结果确认

### 运行环境

- 操作系统
- Shell 或执行环境
- 网络能力
- 浏览器能力
- 权限限制
- 是否依赖账号、Cookie、API key 或本地工具

### 依赖偏好

- 更偏向内置能力、外部 Skill、第三方服务，还是混合方案
- 是否接受安装额外工具
- 是否接受在线 API

### 交付预期

- 只要文档
- 需要 Skill 骨架
- 需要完整 Skill 包
- 需要附带 benchmark 计划

### 脚本化比例

把关键动作分成三类：

- 适合脚本化
- 适合模板化
- 更适合保留人工判断

## 搜索进入点

当下面这些信息已经基本稳定时，就应该准备进入搜索：

- 问题和场景已经清楚
- 目标平台已经确定或接近确定
- 用户已经开始关心复用还是新做
- 外部参考会影响设计决策

此时运行：

1. `python3 utils/cli/search-registry.py --source cocoloop --query '...'`，如果当前目录不在 skill 根目录，就改用 `python3 cocoloop-skill-factory/utils/cli/search-registry.py --source cocoloop --query '...'`
2. `python3 utils/cli/search-registry.py --source clawhub --query '...'`，如果当前目录不在 skill 根目录，就改用 `python3 cocoloop-skill-factory/utils/cli/search-registry.py --source clawhub --query '...'`

这里使用的是一个共享搜索入口，分别承载 `cocoloop-search` 与 `clawhub-search` 两类能力，不额外扩展到其他阶段动作。

如果搜索失败，不要中断主流程。
要在需求结果里标记“缺少外部参考”。

如果进入搜索后已经形成稳定结论，建议同步写一份 `research-summary.md`，把：

- 环境结论
- 搜索结论
- 需求边界
- 是否需要 benchmark

压成一页摘要，供设计阶段直接引用。

## 调研结果格式

结束本阶段前，要整理出一份统一需求结果，至少包含：

```text
- problem
- audience
- scenario
- target_platforms
- environment
- dependency_preference
- delivery_goal
- scriptable_scope
- benchmark_intent
- reference_search_status
```

这份结果可以是 Markdown 摘要，也可以先落到统一 spec 草稿里。
建议同时保留：

- `brainstorming-notes.md`
- `research-summary.md`
- `requirements.md`
- `environment-notes.md`
- `search-summary.md`

## 结束条件

同时满足下面这些条件时，调研阶段结束：

1. 问题定义已经明确
2. 目标平台已经明确，或收敛到可接受范围
3. 依赖偏好和环境限制已经明确
4. 搜索是否进入、进入后得到了什么，已经完成记录
5. 当前版本的交付预期已经明确

结束后进入 `ref/design.md`。
