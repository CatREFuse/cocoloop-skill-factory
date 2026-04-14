---
name: instagram-automation
description: Instagram 全流程自动化运营工具，支持内容发布、数据分析、选题策划、舆情监控。适用于个人博主自动化社媒运营。触发词：Instagram 运营、IG 自动化、社媒运营、发帖助手、Instagram 分析、选题策划、文案生成。
---

# Instagram 自动化运营

Instagram 全流程自动化运营工具，帮助个人博主解决选题收集、脚本撰写、舆情分析、数据分析等最费时的环节。

## 快速开始

### 1. 初始化配置

```bash
# 配置 Instagram 账号
instagram-automation config --username <your_username> --password <your_password>

# 验证登录状态
instagram-automation auth verify
```

### 2. 发布第一条内容

```bash
# 发布单张图片
instagram-automation publish --image /path/to/image.jpg --caption "你的文案"

# 批量发布（读取目录）
instagram-automation publish --batch /path/to/content/folder
```

### 3. 查看数据报告

```bash
# 分析账号数据
instagram-automation analyze --account <username>

# 导出报告
instagram-automation analyze --export --format csv
```

## 核心功能

### 📅 发布管理
- 单图/多图/视频发布
- 定时发布队列
- 批量上传
- 草稿管理

### 📈 数据分析
- 帖子互动数据分析
- 粉丝增长趋势
- 最佳发布时间推荐
- 导出 CSV/JSON

### 📊 选题策划（Phase 2）
- 热点话题追踪
- 竞品内容分析
- 选题推荐列表

### 🎨 内容创作（Phase 2）
- 文案生成辅助
- 标签优化
- 标题建议

### 🔍 舆情监控（Phase 3）
- 品牌提及监控
- 竞品动态追踪
- 评论情感分析

## 命令参考

| 命令 | 功能 | 示例 |
|------|------|------|
| `auth` | 登录管理 | `auth login`, `auth verify`, `auth logout` |
| `publish` | 内容发布 | `publish --image img.jpg --caption "文案"` |
| `analyze` | 数据分析 | `analyze --account user --days 30` |
| `research` | 选题策划 | `research --trending --hashtag #话题` |
| `schedule` | 定时任务 | `schedule --list`, `schedule --add` |
| `config` | 配置管理 | `config --show`, `config --reset` |

## 配置指南

### 账号配置

配置文件位置：`~/.instagram-automation/config.json`

```json
{
  "accounts": [
    {
      "username": "your_username",
      "password": "encrypted_password",
      "cookiePath": "~/.instagram-automation/cookies/your_username.json"
    }
  ],
  "defaultAccount": "your_username",
  "rateLimit": {
    "minDelay": 2000,
    "maxDelay": 5000,
    "maxPostsPerHour": 4
  }
}
```

### 风控设置

```json
{
  "rateLimit": {
    "minDelay": 2000,      // 操作最小间隔（毫秒）
    "maxDelay": 5000,      // 操作最大间隔（毫秒）
    "maxPostsPerHour": 4,  // 每小时最大发布数
    "maxActionsPerDay": 50 // 每日最大操作数
  },
  "humanBehavior": {
    "randomScroll": true,   // 随机滚动模拟
    "randomPause": true,    // 随机暂停
    "mouseMovement": true   // 模拟鼠标移动
  }
}
```

## 注意事项

### 账号安全
- 建议使用专用运营账号
- 避免高频操作导致封号
- 定期检查登录状态
- 启用双重验证时需手动处理

### 频率限制
- 每小时最多发布 4 条
- 每日最多操作 50 次
- 操作间隔 2-5 秒随机

### 风控建议
- 新账号先养号（正常浏览、点赞 1-2 周）
- 避免突然大量发布
- 内容质量优先于数量
- 关注 Instagram 政策变化

## 故障排查

### 登录失败
1. 检查用户名密码
2. 确认账号未被锁定
3. 如有双重验证，需手动登录一次
4. 参考 [troubleshooting.md](references/troubleshooting.md)

### 发布失败
1. 检查图片格式（JPG/PNG）
2. 确认图片尺寸符合要求
3. 查看网络连接
4. 检查频率限制状态

### 数据获取失败
1. 确认账号已登录
2. 检查账号是否公开
3. 查看选择器配置是否需要更新
4. 参考 [selectors.md](references/selectors.md)

## 高级功能

### 定时发布

```bash
# 添加定时任务
instagram-automation schedule add \
  --image /path/to/image.jpg \
  --caption "定时文案" \
  --time "2026-04-15 14:00"

# 查看任务队列
instagram-automation schedule list

# 取消任务
instagram-automation schedule cancel --id <task_id>
```

### 批量操作

```bash
# 批量发布（按文件名排序）
instagram-automation publish --batch /path/to/folder --sort name

# 批量分析
instagram-automation analyze --batch --accounts account1,account2
```

### 数据导出

```bash
# 导出 CSV
instagram-automation analyze --export --format csv --output report.csv

# 导出 JSON
instagram-automation analyze --export --format json --output report.json
```

## 参考资料

- [API 参考](references/api-reference.md) - Instagram 页面操作 API
- [选择器配置](references/selectors.md) - CSS 选择器说明
- [频率限制](references/rate-limits.md) - 风控策略详解
- [故障排查](references/troubleshooting.md) - 常见问题解决

## 技术栈

- **浏览器自动化**: Playwright
- **定时任务**: node-cron
- **数据存储**: SQLite
- **导出格式**: CSV/JSON

## 许可证

MIT License - 仅供学习和研究使用，请遵守 Instagram 平台政策。
