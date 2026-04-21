# 任务域预设目录

## 目标

这里放的是 `skill-factory` 在调研、设计和构建准备阶段可以直接引用的任务域预设。
预设不是最终 Skill，也不是平台模板。
预设负责三件事：

- 帮主流程先判断任务属于哪个域
- 帮调研阶段少走弯路，直接使用高频问题包
- 帮设计和构建准备阶段快速收口推荐执行面、风险边界和默认产物

## 第一层优先预设

| 预设 | 适用方向 | 文档 |
| --- | --- | --- |
| 工程交付 | PR、CI、仓库维护、MCP、Skill 构建 | [engineering-delivery.md](./engineering-delivery.md) |
| 前端与设计到代码 | 页面、界面、设计稿实现、设计系统 | [frontend-design.md](./frontend-design.md) |
| 浏览器自动化与 UI 测试 | 截图、快照、交互验证、持久 QA | [browser-ui-testing.md](./browser-ui-testing.md) |
| 文档与办公产物 | PDF、Word、PPT、Excel 处理与生成 | [document-artifacts.md](./document-artifacts.md) |
| 文档检索与研究 | 官方文档检索、引用、知识沉淀、研究整理 | [docs-research.md](./docs-research.md) |

## 每个预设都固定包含

- `domain_id`
- `common_jobs`
- `default_question_pack`
- `recommended_execution_planes`
- `risk_and_gates`
- `default_outputs`

## default_question_pack 的使用规则

- 它是候选问题池，不是整包必问清单。
- 进入调研后，先从预设里排出最小问题集，再开始追问。
- 整轮需求调研默认不超过 10 个问题，确认题也计入预算。
- 能用已有上下文、环境检测、默认值和确认题解决的，不再重复追问。
- 如果预设问题还没问完但预算已接近上限，把剩余不确定项写入 `open_gaps`，不要继续拉长访谈。

## 使用顺序

1. 先判断主任务域。
2. 如果明显跨域，再补 `peer_domains`。
3. 读取对应预设，使用默认问题包继续调研。
4. 读取预设里的执行面建议，作为设计阶段的默认候选。
5. 读取预设里的默认输出，帮助生成 `spec.yaml`、研究摘要和构建计划。

## 组合规则

- 单域需求：只使用一个预设。
- 跨域需求：先用主域预设，再把次域当补充约束。
- 如果没有预设完全匹配：先选最接近的主域预设，再把剩余部分写入 `open_gaps`。
- 如果需求高度独特：允许跳过预设，但必须在研究产物里说明原因。
