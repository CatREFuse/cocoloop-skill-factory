# PPT 生成

## 适用场景

这个能力用于生成或修改演示稿，包括：

- 商业 pitch deck
- 研究总结 slides
- 培训材料
- 汇报型 `.pptx`
- HTML slides
- 需要多页结构的视觉化讲解页

## 先做哪种判断

演示稿能力现在默认拆成三层：

### 第 1 层：brief / interview

先确认：

- 主题
- 受众
- speaker
- work / evidence
- angle
- CTA

最好的参考是 `ai-presentation-maker`。

### 第 2 层：outline

把输入压成结构化 slide outline，而不是直接开做页面。

最好的参考是 `text-to-ppt` 的 JSON 大纲，以及 `ai-presentation-maker` 的 deck 结构。

### 第 3 层：render / export

最后再决定走：

- HTML slides
- `.pptx`
- PDF
- Gamma markdown

最好的参考是 `ppt-maker` 和 `ai-presentation-maker` 的导出层。

## 输入

- 演示目标
- 目标受众
- 参考材料
- speaker 信息
- 页数范围或节奏
- 风格与品牌要求
- 是否必须可编辑
- 输出格式偏好

## 输出

- 推荐的演示稿执行方向
- 结构化 brief
- 结构化 outline
- 渲染与导出策略
- factual validation 和版式校验策略
- 降级路径

## 最佳实践

### 1. 先做 brief，再做 deck

这类任务最不稳定的做法，就是直接从主题跳到第一页。

推荐最小 brief：

- `presentation-brief.json`

建议字段：

- subject
- audience
- speaker
- work
- results
- costs
- mistakes
- angle
- resources
- CTA

这条做法直接来自 `ai-presentation-maker`。

### 2. 必须有结构化大纲

无论输入来自访谈、文档还是 Markdown，后续都建议统一沉到：

- `slide-outline.json`

每页最少包含：

- number
- type
- heading
- points 或 body
- data / chartData
- layout
- notes

这一步决定能否稳定并行生成、能否切换渲染器、能否做校验。

### 3. HTML slides 和 `.pptx` 分开看

这两条链路都重要，但它们不是一个东西。

#### HTML slides

适合：

- 视觉质量优先
- 展示优先
- 浏览器直接播放
- 打印 PDF
- 强风格和单页控制

代表参考：

- `text-to-ppt`
- `ai-presentation-maker`

#### 原生 `.pptx`

适合：

- 需要 PowerPoint 可编辑性交付
- 企业协作改稿
- 后续继续改字、改图表、改布局

代表参考：

- `ppt-maker`
- `slides`

### 4. 演示稿要把“事实校验”当成正式能力

这轮最值得吸收的不是纯排版，而是 `ai-presentation-maker` 的 factual validation。

建议默认检查：

- speculative claims
- unverified numbers
- projections without caveat
- superlatives
- text overflow

这不该只放在 review 阶段，应该算 presentation 能力的一部分。

## 如何拆解信息

### 访谈驱动型

推荐按下面的顺序收集：

1. subject
2. audience
3. speaker
4. work
5. angle
6. resources / CTA

收集的核心目标不是聊天，而是为每个 slide 找到真实来源。

### 文本驱动型

如果输入已经是研究报告、总结、提案或计划文档，推荐先转成 slide outline，而不是直接写页面。

### Markdown 驱动型

如果输入本来已经很结构化，也可以走 Markdown DSL：

- `#` 封面
- `##` 分页
- `###` 页内标题
- 列表、表格、引用、代码块分别映射组件

这条路适合原生 `.pptx` 快速生产。

## 如何组织大纲

### 推荐流程

1. 定 angle
2. 定 narrative arc
3. 列 core slides
4. 判断 situational slides
5. 定 closing 和 CTA

建议最少要有：

- title
- hook
- problem
- what we built
- results
- CTA / closing

如果素材支持，再补：

- costs
- mistakes
- why now
- DIY path
- projections with caveat

### 每页结构建议

每页建议明确：

- slide_type
- title
- key message
- evidence
- visual intent
- speaker note hint

## 如何写文案

### 默认规则

- 先选 angle，再写文案
- slide 文案短而准
- 每页只承载一个核心意思
- 数字、结论、经验都要能回溯到素材

### 商业和汇报型演示稿

建议默认保留这些约束：

- 不编数字
- 不做空洞 superlative
- projection 必须有 caveat
- “What NOT to say” 值得保留在 speaker notes 里

### 工程化生成型演示稿

如果走 outline 或 Markdown DSL 路线，建议：

- 大纲先稳定
- 每页文案有长度上限
- 数据项显式声明是否可视化
- notes 单独存放，不混入正文

## 如何排版

### HTML slides

推荐的排版原则：

- 16:9
- 无滚动
- slide type 和 theme 分离
- 支持 notes 面板
- 支持打印 PDF
- 支持独立 per-slide HTML 或 combined deck

推荐单独表达：

- `slide_type`
- `theme`

### 原生 `.pptx`

推荐的排版原则：

- cover / content / ending 分页明确
- 主题色和图表色分离
- 列表、代码块、引用块、表格都有独立 renderer
- 图表页支持双栏布局

`ppt-maker` 的实现说明了：原生 `.pptx` 路线最实用的不是极致视觉，而是“结构清晰、可编辑、图表稳定”。

## 如何输出美观 HTML 和 `.pptx`

### HTML

最稳定的链路是：

1. 先 brief
2. 再 outline
3. 按页渲染
4. 最后 shell assemble

或者：

1. 先 Markdown deck
2. 再 combined HTML export
3. 再 per-slide HTML export

适合把 HTML 当主交付。

### `.pptx`

建议两条路分开看：

#### 路线 A：直接生成 `.pptx`

适合：

- 需要原生可编辑 deck
- 输入本来就结构化

可借鉴：

- `ppt-maker`
- `slides`

#### 路线 B：先有 deck，再导出 `.pptx`

适合：

- 已经先生成 Markdown deck
- 需要给 PowerPoint 用户一个可接手版本

可借鉴：

- `ai-presentation-maker/references/export-pptx.py`

### 导出器建议

后续建议单独表达这些导出器：

- `deck_markdown_to_html`
- `deck_markdown_to_pptx`
- `html_slides_to_pdf`

## 推荐执行方向

### 方向 1：`slides` 或原生 `.pptx` renderer

适合：

- 交付要求明确是 `.pptx`
- 需要多人协作改稿
- 图表和文本都要继续编辑

### 方向 2：HTML slides 优先

适合：

- 展示效果优先
- 强风格、强动画、强导出
- 可以浏览器直接播放

### 方向 3：混合链路

适合：

- 先做 HTML 确认视觉
- 再补 `.pptx` 交付

## 边界

- 不把最终 `.pptx` 等同于一组图片拼起来
- 不忽视字体替换和文本溢出
- 不在没有 outline 的情况下直接写整套 deck
- 不把 factual validation 当可选项

## 降级策略

- 信息不足时，先交付 brief 和 outline
- 页面过多时，先确定骨架页和示例页
- 风格没定时，先做结构版 deck
- 无法直接出 `.pptx` 时，先交付 HTML slides 或 Markdown deck

## 与主流程的关系

这个能力最适合挂在 `document_artifacts` 主域下，也可以和 `docs_research` 或 `frontend_design` 组合使用。

如果进入正式设计比较，建议同时回看：

- [clawhub-infographic-ppt-deep-dive/reference-skill-analysis.md](/Users/tanshow/Developer/cocoloop-skill-factory-dev/cocoloop-skill-factory/output/clawhub-infographic-ppt-deep-dive/reference-skill-analysis.md)
- [clawhub-infographic-ppt-deep-dive/design-summary.md](/Users/tanshow/Developer/cocoloop-skill-factory-dev/cocoloop-skill-factory/output/clawhub-infographic-ppt-deep-dive/design-summary.md)
