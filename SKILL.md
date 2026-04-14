---
name: cocoloop-skill-factory
description: 用于创建或升级多平台 Agent Skill 的 Meta Skill。适用于用户想把模糊想法收敛成可进入设计与构建准备阶段的 Skill 方案、需要结合 Cocoloop 与 ClawHub 搜索参考、选择平台模板、组织原子能力、补齐脚本化规划，并按需生成 benchmark 计划时。
---

# CocoLoop Skill Factory

当前版本阶段声明：
本目录当前只承接需求、设计和构建准备文档，不承诺直接生成 Skill 包或自动执行 benchmark。

## Overview

`cocoloop-skill-factory` 是一个面向 `codex`、`claude code`、`openclaw`、`copaw`、`molili`、`hermes agent` 的 Meta Skill。
它负责把用户的想法推进成一份稳定 spec，并把构建方向、模板选择、原子能力和脚本化策略整理清楚，而不是只停在需求讨论或零散建议。

当用户出现这些诉求时使用本 Skill：

- 想从零创建一个新 Skill
- 想升级、改造、移植一个已有 Skill
- 想先找现成 Skill，再判断复用、改造还是新做
- 想把平台差异、脚本化能力、模板选择和 benchmark 规划统一起来

## Factory Rules

整个流程都围绕这几条规则执行：

1. 先形成 spec，再进入构建准备。
2. 调研和设计都保持双钻节奏，先发散，再收敛。
3. **分步询问：对话每次只推进一个关键问题，严禁一次性列出所有问题等待用户回答。必须等用户回答后再问下一个问题。**
4. `cocoloop` 与 `clawhub` 搜索在正常环境下默认进入流程；不可用时允许降级，但要记录缺口。
5. 当前阶段只把环境检测与搜索这类基础动作保留为 CLI，其余脚本化能力只做规划，不直接落地。
6. 推荐外部方案时，要同时给出接入方式、依赖门槛、风险和替代路径。
7. `benchmark` 是可选阶段，只在适合比较的任务里进入。

## Workflow

命令运行约定：

- 如果当前目录是 `cocoloop-skill-factory/`，使用 `python3 utils/cli/<script>.py ...`
- 如果当前目录是工作区根目录，使用 `python3 cocoloop-skill-factory/utils/cli/<script>.py ...`
- CLI 文件带有 shebang，也可以直接执行，但默认优先推荐 `python3 ...` 的写法

关键 CLI：

- `detect-environment.py`
- `search-registry.py`

当前 CLI 边界：

- `detect-environment.py` 用于环境检测
- `search-registry.py` 用于统一承载 `cocoloop` 与 `clawhub` 搜索
- 当前版本不提供 spec 生成、skill 构建、skill 校验或 benchmark 执行的自动化 CLI

其中 `search-registry.py` 是对 PRD 中 `cocoloop-search` 与 `clawhub-search` 的合并实现，只覆盖搜索能力本身，不新增额外流程能力。

### Step 1: Initialize

先快速建立当前任务边界。

执行动作：

1. 判断用户要创建新 Skill，还是升级已有 Skill。
2. 检查当前仓库、工作区或现有文件里是否已经有相关上下文。
3. 运行 `python3 utils/cli/detect-environment.py`，获取平台、系统、Shell、浏览器与本地工具线索。
4. 如果用户说“目标平台就是当前环境”，用检测结果提供候选线索，再请用户确认。
5. 判断当前环境里是否已有成熟 `brainstorming` 能力；如没有，再回退到 `sub-skills/brainstorm/SKILL.md`。

### Step 2: Research

进入需求调研阶段时，阅读 `ref/research.md`。

**调研阶段核心原则：分步询问，一次一个问题**

- 每一轮对话只问一个关键问题，严禁一次性列出多个问题
- 必须得到用户回答后，才能决定并询问下一个问题
- 如果用户给出的信息涉及多个维度，拆分成连续轮次推进
- 维持对话的连续性，避免信息过载

**提问交互格式：**

1. **选项类问题**：提供 3-5 个有序选项（1-5），便于用户直接回复数字
   - 示例：目标平台选择、交付预期选择
   - 必须标注推荐答案

2. **路径选择类问题**：提供 2-3 个实现路径
   - 示例：复用现成 / 改造 / 从零设计
   - 必须说明各路径的适用场景、优势和风险
   - 明确标注推荐路径及理由

3. **开放式问题**：提供提示和示例，引导用户描述
   - 示例：「请描述核心问题是什么？提示：从谁在什么场景下遇到什么痛点来描述」

4. **确认类问题**：汇总已确认信息，提供继续/暂停/修改选项
   - 示例：「当前已确认：... 是否继续？1. ✅ 确认 2. ⏸️ 暂停 3. 📝 修改」

调研阶段必须拿到这些信息（分步采集）：

- 用户想解决的问题与使用场景
- 目标平台与运行环境
- 依赖偏好与权限限制
- 交付预期
- 哪些能力应脚本化，哪些保持文档或模板表达
- 成功标准与是否需要 benchmark

如果用户一开始就已经给出很清楚的 spec，可缩短调研轮数，但不能跳过收口确认。

### Step 3: Search And Reference

当需求轮廓已经稳定，就进入搜索判断。

默认顺序：

1. 运行 `python3 utils/cli/search-registry.py --source cocoloop --query '...'`
2. 运行 `python3 utils/cli/search-registry.py --source clawhub --query '...'`
3. 把结果整理成“直接复用 / 参考改造 / 仅供借鉴 / 放弃”四种结论

判断时至少回答这些问题：

- 候选 Skill 与当前需求的重合度有多高
- 是否覆盖目标平台
- 是否有明显依赖门槛或安全风险
- 如果采用它，用户得到的是安装、二次设计，还是只拿它的能力结构

如果搜索不可用，保留降级记录，再继续设计流程。

### Step 4: Design

进入设计阶段时，阅读 `ref/design.md`。

设计阶段必须先展开两到三条路线，再帮助用户收敛。常见路线：

- 直接复用现成 Skill
- 基于现成 Skill 做二次设计
- 从零构建新 Skill

设计收口时，要明确这些结论：

- 当前版本的目标与边界
- 目标平台集合
- 主流程结构
- 内置原子能力与外部依赖的取舍
- 平台模板选择
- benchmark 是否进入，以及为什么

### Step 5: Construction Planning

进入构建准备时，阅读 `ref/construction.md`。

此阶段的核心动作：

1. 把研究与设计结论整理成统一 spec 和构建说明。
2. 阅读 `atomic-capabilities/index.md`，为关键能力选择可复用模块。
3. 阅读 `utils/template/` 下的目标平台模板，明确输出骨架、元数据差异和脚本策略。
4. 调用 `sub-skills/skill-creator/SKILL.md`，把 spec 转成可执行的构建计划。
5. 如果任务适合比较验证，再阅读 `utils/benchmark.md`，只规划 benchmark 的进入条件、样本和判定标准。

建议在这一阶段保留的文档产物：

- `brainstorming-notes.md`
- `research-summary.md`
- `design-summary.md`
- `spec.md`
- `build-plan.md`
- `benchmark-plan.md`（仅在进入 benchmark 时）

### Step 6: Deliver

默认交付物包括：

- 一份收口后的统一 spec
- 一份设计决策摘要
- 一份构建计划或构建说明
- 外部依赖的接入说明
- 按需生成的 benchmark 计划

如果用户只想得到设计方案，不想立即落地产物，可以在 spec 和设计决策确认后结束。

## Fast Paths

### 用户已经带着参考 Skill 来了

先检测环境，再直接做差异分析：

1. 当前参考 Skill 覆盖了哪些能力
2. 哪些地方要保留
3. 哪些地方要替换
4. 哪些平台适配要重写

### 用户只想找现成 Skill

仍然要先补齐最小需求轮廓，再搜索。
不要在问题尚未收敛时直接把一串候选列表甩给用户。

### 用户只想做平台迁移

优先保留原 Skill 的目标、触发方式和能力边界，再聚焦模板映射、依赖表达和目录结构变化。

## Local Resources

按下面的顺序读取资源，避免一次加载过多内容：

- `ref/research.md`
  需求调研阶段的对话骨架、必填信息和阶段出口
- `ref/design.md`
  方案展开、比较和收口方式
- `ref/construction.md`
  如何把统一 spec 收口为构建计划与产物边界
- `sub-skills/brainstorm/SKILL.md`
  没有外部 brainstorming 时的兜底调研子 Skill
- `sub-skills/skill-creator/SKILL.md`
  进入构建准备阶段时的规划子 Skill
- `atomic-capabilities/index.md`
  原子能力索引与组合建议
- `utils/template/*.md`
  平台模板、结构差异和选择条件
- `utils/cli/*.py`
  环境检测与搜索标准化
- `utils/benchmark.md`
  benchmark 进入条件与输出格式

## Output Contract

产出构建计划或 Skill 方案文档时，至少检查这些项目：

1. `SKILL.md` 是否能独立说明触发场景、流程和资源读取顺序
2. 目标平台模板是否与最终目录结构一致
3. 外部依赖是否都有接入说明和降级路径
4. 当前阶段允许脚本化的动作是否仍只限于环境检测与搜索
5. `molili` 是否按独立平台处理，没有被并入 `copaw`
6. 是否已经明确目标平台对应的目录和元数据要求
7. benchmark 若被启用，是否明确了 `0 skill` 与目标 Skill 方案效果的比较对象

## Boundaries

本 Skill 负责 spec 驱动、方案组织、参考检索和构建规划。
它不会把搜索命中当作唯一前提，也不会默认替用户跳过需求收口。

如果当前任务只适合出文档，不适合进入下一阶段实现，可以在说明原因后收口到文档阶段。
