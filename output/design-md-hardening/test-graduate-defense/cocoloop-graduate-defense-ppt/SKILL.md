---
"name": "cocoloop-graduate-defense-ppt"
"description": "把研究主题、方法、结果与答辩要求整理成适合研究生毕业答辩的演示稿结构，并在可用时继续导出 PPT"
"version": "0.1.0"
"author": "tanshow"
"when_to_use": "把研究主题、方法、结果与答辩要求整理成适合研究生毕业答辩的演示稿结构，并在可用时继续导出 PPT. Typical scenarios: 根据论文摘要与实验结果生成毕业答辩提纲; 把研究背景、方法、实验结果和结论整理成页面级答辩结构; 在有视觉要求时使用默认设计风格生成正式答辩稿"
"user-invocable": true
"generated_by_cocoloop": true
---
# Graduate Defense PPT

## Overview

把研究主题、方法、结果与答辩要求整理成适合研究生毕业答辩的演示稿结构，并在可用时继续导出 PPT

## Use Cases

- 根据论文摘要与实验结果生成毕业答辩提纲
- 把研究背景、方法、实验结果和结论整理成页面级答辩结构
- 在有视觉要求时使用默认设计风格生成正式答辩稿

## Inputs

- `research_materials`: 论文摘要、研究问题、方法、实验结果、创新点和结论
- `defense_constraints`: 答辩时长、目标页数、学校或导师要求、语言偏好

## Outputs

- `defense_slides` (pptx_or_structured_slides): 适合研究生毕业答辩的演示稿

## Design Input
- For webpage, infographic, PPT, and other visual output tasks, read `references/design.md` before high-fidelity design.
- Users can keep the default official preset, switch to another preset in `references/design-md/`, or replace it with their own `DESIGN.md`.
- Current source mode: `preset`
- Current preset: `ibm`
## Must Have

- 收集答辩主题、研究问题、方法、结果和页数约束
- 生成封面、目录、背景、方法、结果、创新点、结论与致谢的答辩结构
- 启用 design_md 并输出默认设计入口
- 在无法导出 .pptx 时退回结构化替代结果

## Excluded

- 不自动伪造实验数据
- 不处理学院官方模板下载
- 不保证当前环境一定能直接导出 .pptx

## Target Platforms

- `codex` (supported_public): 主流程验证平台
- `claude_code` (supported_public): 兼容验证平台

## Dependencies

- `design-md library` (reference): 提供默认设计起点
- `factory-skill-builder` (builder): 负责把 spec 渲染成 Skill

## Fallback Policy

- Allowed: yes
- Summary: 当缺少可用 PPT renderer 时，退回到结构化 slides 结果，并保留后续继续导出所需的页面层级
