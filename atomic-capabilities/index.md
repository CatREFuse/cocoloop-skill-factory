# 原子能力资料库

## 目标

这里放的是 `cocoloop-skill-factory` 在调研、设计、构建时可以直接引用的原子能力说明。每个能力都强调四件事：什么时候选、边界在哪里、输入是什么、降级怎么走。

## 使用方式

1. 先判断用户目标属于哪类问题。
2. 再看是否能被单一原子能力覆盖。
3. 如果一个能力不够，就用两到三个能力组合。
4. 如果外部条件不足，就走降级策略，不要中断主流程。

## 能力目录

| 能力 | 适用场景 | 文档 |
| --- | --- | --- |
| 搜索与信息获取 | 找现成 Skill、找参考方案、补充事实和上下文 | [search-and-info/index.md](./search-and-info/index.md) |
| 文件读写与整理 | 读取、改写、归档、重排文档与目录 | [file-ops/index.md](./file-ops/index.md) |
| 数据解析与转换 | JSON、YAML、CSV、Markdown、表格之间互转 | [data-parse-transform/index.md](./data-parse-transform/index.md) |
| 外部服务接入 | API、鉴权、回调、限流、配置接入 | [external-service/index.md](./external-service/index.md) |
| 浏览器访问 | 页面查看、信息提取、表单与页面操作 | [browser-access/index.md](./browser-access/index.md) |
| 文档生成 | 生成需求文档、设计文档、Skill 文档、说明文档 | [document-generation/index.md](./document-generation/index.md) |
| 子 Skill 调用 | 把复杂流程拆给子 Skill，或复用既有子流程 | [subskill-invocation/index.md](./subskill-invocation/index.md) |
| 模板映射 | 把需求映射到平台模板与落地结构 | [template-mapping/index.md](./template-mapping/index.md) |

## 选型规则

- 先选最小能力，再考虑组合。
- 能在文本层完成的，不先上浏览器。
- 能在本地文件层完成的，不先上外部服务。
- 能用已存在子 Skill 承接的，不自己展开长流程。
- 模板映射只负责判断方向，不负责直接生成最终产物。

## 降级总则

- 外部搜索不可用时，继续做需求整理和方案设计。
- 浏览器不可用时，转为文档输入、用户描述或手动核对。
- 外部服务不可用时，保留配置位和接入说明，不阻断主流程。
- 子 Skill 不可用时，退回到主流程中的内联步骤。
- 模板不匹配时，选最保守的模板，并明确写出缺口。

