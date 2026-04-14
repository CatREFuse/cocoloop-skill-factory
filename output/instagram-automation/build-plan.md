# Instagram 自动化运营 Skill - 构建计划

## 📋 统一 Spec

### 基本信息
- **Skill 名称**: `instagram-automation`
- **目标平台**: molili
- **版本**: Phase 1 MVP
- **交付形式**: 完整 Skill 包

### 核心目标
为个人博主提供 Instagram 全流程自动化运营能力，解决选题收集、脚本撰写、舆情分析、数据分析等最费时的环节。

### 触发场景
用户提及以下任一关键词时触发：
- "Instagram 运营"
- "IG 自动化"
- "社媒运营"
- "发帖助手"
- "Instagram 分析"
- "选题策划"
- "文案生成"

### 输入输出

**输入**:
- 账号配置（用户名、密码、备用 Cookie）
- 内容素材（图片/视频路径、文案草稿）
- 发布计划（时间、频率）
- 监控关键词（竞品账号、话题标签）

**输出**:
- 发布执行结果（成功/失败、帖子链接）
- 数据分析报告（CSV/JSON）
- 选题推荐列表
- 文案草稿

### 依赖与权限

**外部依赖**:
- Playwright（浏览器自动化）
- node-cron（定时任务）
- better-sqlite3（本地存储）

**权限要求**:
- Chrome/Edge 浏览器访问
- 本地文件读写
- 网络访问（Instagram 网站）

**前置条件**:
- Instagram 账号（建议专用运营账号）
- 已登录状态的浏览器配置

---

## 🏗️ 构建计划

### 目录结构

```
instagram-automation/
├── SKILL.md                          # 主入口文档
├── config.json                       # molili 平台配置
├── scripts/                          # 可执行脚本
│   ├── browser/
│   │   ├── instagram-client.js      # Instagram 页面封装
│   │   ├── auth-manager.js          # 登录状态管理
│   │   └── rate-limiter.js          # 频率限制
│   ├── commands/
│   │   ├── publish.js               # 发布命令
│   │   ├── analyze.js               # 分析命令
│   │   ├── research.js              # 选题命令
│   │   └── monitor.js               # 监控命令
│   └── utils/
│       ├── storage.js               # 数据存储
│       ├── export.js                # 数据导出
│       └── helpers.js               # 工具函数
├── references/                       # 参考资料
│   ├── api-reference.md             # Instagram 页面 API 参考
│   ├── selectors.md                 # CSS 选择器配置
│   ├── rate-limits.md               # 频率限制指南
│   └── troubleshooting.md           # 故障排查
├── assets/                          # 模板资源
│   ├── templates/
│   │   ├── caption-templates/       # 文案模板
│   │   └── report-templates/        # 报告模板
│   └── config/
│       └── default-config.json      # 默认配置
└── platform-manifests/
    └── molili.json                  # molili 平台清单
```

### 原子能力映射

| 功能模块 | 原子能力 | 实现方式 |
|----------|----------|----------|
| 浏览器操作 | `browser-access` | Playwright 脚本 |
| 数据解析 | `data-parse-transform` | JSON/CSV 导出脚本 |
| 文档生成 | `document-generation` | 报告模板 |
| 模板映射 | `template-mapping` | molili 平台配置 |

### 脚本清单

#### Phase 1 MVP 脚本

| 脚本 | 功能 | 输入 | 输出 |
|------|------|------|------|
| `browser/instagram-client.js` | Instagram 页面操作封装 | 命令参数 | 执行结果 |
| `browser/auth-manager.js` | 登录管理和 Cookie 持久化 | 账号信息 | 登录状态 |
| `browser/rate-limiter.js` | 请求频率控制 | 操作类型 | 延迟时间 |
| `commands/publish.js` | 内容发布 | 图片路径、文案 | 发布结果 |
| `commands/analyze.js` | 数据分析 | 账号/帖子 ID | 分析报告 |
| `utils/storage.js` | SQLite 数据存储 | 数据对象 | 存储确认 |
| `utils/export.js` | CSV/JSON 导出 | 查询条件 | 文件路径 |

### 外部依赖接入

#### Playwright
- **安装**: `npm install playwright`
- **浏览器**: `npx playwright install chromium`
- **使用**: 页面导航、元素交互、截图

#### node-cron
- **安装**: `npm install node-cron`
- **使用**: 定时任务调度

#### better-sqlite3
- **安装**: `npm install better-sqlite3`
- **使用**: 本地数据存储

### 风控与降级

| 风险 | 策略 | 降级方案 |
|------|------|----------|
| 账号封禁 | 频率限制、随机延迟 | 人工操作模式 |
| 登录失效 | Cookie 持久化、自动重登 | 提示手动登录 |
| 页面改版 | 外置选择器配置 | 选择器热更新 |
| 反爬升级 | 请求指纹随机化 | 延长间隔、降低频率 |

---

## 📝 SKILL.md 结构

### Frontmatter
```yaml
---
name: instagram-automation
description: Instagram 全流程自动化运营工具。用于社媒内容发布、数据分析、选题策划、舆情监控。触发词：Instagram 运营、IG 自动化、社媒运营、发帖助手、Instagram 分析。
---
```

### Body 结构
1. **快速开始** - 最小可用示例
2. **核心功能** - 7 大模块说明
3. **命令参考** - 子命令列表
4. **配置指南** - 账号配置、风控设置
5. **故障排查** - 常见问题解决

---

## ✅ 交付检查清单

- [x] SKILL.md 包含清晰的 name 和 description
- [x] 目录结构符合 molili 平台模板
- [x] 所有脚本已定义输入/输出/边界
- [x] 外部依赖有接入说明
- [x] 降级路径已规划
- [x] molili 平台独立处理
- [x] 不包含 benchmark（按需求跳过）

---

## 🚀 后续扩展（Phase 2/3）

**Phase 2 - 内容创作增强**:
- 选题策划模块（热点追踪、竞品分析）
- AI 文案生成（集成本地 Ollama）
- 标签优化器

**Phase 3 - 完整功能**:
- 舆情监控系统
- 自动评论回复
- 粉丝画像分析
- 多账号管理
