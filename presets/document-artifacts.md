# 文档与办公产物预设

## domain_id

`document_artifacts`

## common_jobs

- 处理 PDF、Word、PPT、Excel
- 合并、拆分、抽取、重排文件
- 生成正式文档
- 从原始材料生产可交付办公产物
- 生成或修改 `.pptx` 演示文稿

## default_question_pack

- 当前交付物是什么文件类型
- 是处理已有文件，还是新生成文件
- 更看重读取抽取、格式重排，还是最终排版
- 是否需要批量处理
- 是否需要脚本化文件转换
- 如果是 PPT，是否必须保留可编辑性和源文件

## recommended_execution_planes

- `Skill + slides + PptxGenJS`
  适合稳定生成和修改 `.pptx`
- `Skill + 文件脚本`
  适合稳定、可重复的文件处理
- `Skill-only`
  只适合规划文档结构或写作约束，不适合最终文件生成

## risk_and_gates

- 先确认真实交付文件类型
- 如果是 PPT，先确认页数范围、比例和是否必须可编辑
- 大文件或多文件流程要控制输出体积
- 如果文件损坏风险高，要优先规划可回滚和副本策略
- 需要明确哪些结果是提取，哪些结果是改写

## default_outputs

- `research-summary.md`
- `reference-skill-analysis.md`
- `design-summary.md`
- `spec.md`
- `build-plan.md`
- 文件处理场景建议保留脚本化比例说明
