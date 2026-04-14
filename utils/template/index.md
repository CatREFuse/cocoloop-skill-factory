# 多平台模板资料库

## 目标

这里放的是 `cocoloop-skill-factory` 可直接引用的模板说明。每个模板都说明适合谁、什么时候选、输入什么、输出什么，以及不能怎么用。

## 使用方式

1. 先看目标平台。
2. 再看 Skill 是否需要子流程、脚本或外部依赖。
3. 再选最贴近交付形态的模板。
4. 如果平台不完整，就先用保守模板，再补平台差异。

## 模板目录

| 模板 | 适用平台 | 文档 |
| --- | --- | --- |
| Codex 模板 | `codex` | [codex-skill-template.md](./codex-skill-template.md) |
| Claude Code 模板 | `claude code` | [claude-code-skill-template.md](./claude-code-skill-template.md) |
| OpenClaw 模板 | `openclaw` | [openclaw-skill-template.md](./openclaw-skill-template.md) |
| Copaw 模板 | `copaw` | [copaw-skill-template.md](./copaw-skill-template.md) |
| Molili 模板 | `molili` | [molili-skill-template.md](./molili-skill-template.md) |
| Hermes Agent 模板 | `hermes agent` | [hermes-agent-skill-template.md](./hermes-agent-skill-template.md) |

## 选型规则

- 平台优先。
- 平台相同的时候，结构复杂度优先。
- 需要脚本化时，选能清楚表达脚本边界的模板。
- 需要子 Skill 时，选能清楚表达交接的模板。
- 如果目标还不稳定，先用平台无关的保守骨架。

## 共用要求

所有模板都应保留这些信息位：

- 目标
- 适用边界
- 输入
- 输出
- 主流程
- 子能力或子 Skill
- 外部依赖
- 失败时怎么降级

