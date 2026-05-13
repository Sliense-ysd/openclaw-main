# Semrush Monitor Skill

监控外链在 Semrush 的收录状态，并同步到飞书 Bitable。

## 功能

### 1. 每日外链收录检查
- 从 Semrush 提取指定站点的引荐域名
- 与飞书「日常统计」表对比
- 已收录的外链移入「收录统计」表
- 计算收录天数（发布日期 + 3天延迟）

### 2. 数据源

**Semrush**
- 访问地址：sem.3ue.com
- 账号：Pluviobyte
- 必须使用 headed Playwright + stealth（绕过 Cloudflare）
- URL 参数 `perdomain=1` 减少翻页

**飞书 Bitable**
- 日常统计表 (tblaMsBwA96hAgfR)：外链提交记录
- 收录统计表 (tblNJSvkynCSZjtG)：已收录外链

## 使用方法

### 手动执行

```bash
cd /Users/rain/.openclaw/workspace
node scripts/semrush-extract-all-domains.mjs project-genie.ai
node scripts/move-backlinks.mjs
```

### 定时任务

每天 10:00 自动执行：

```json
{
  "name": "每日外链收录检查",
  "schedule": {
    "kind": "cron",
    "expr": "0 10 * * *",
    "tz": "Asia/Shanghai"
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "执行每日外链收录检查"
  },
  "delivery": {
    "mode": "announce",
    "channel": "telegram"
  }
}
```

## 收录判定逻辑

收录天数 = 今天 - 发布日期 - 3天（Semrush 延迟）

- ≤5天 → 收录区间: 5天内
- 6-10天 → 收录区间: 5-10天
- 11-30天 → 收录区间: 10-30天
- 31-180天 → 收录区间: 30-180天
- >180天 → 超期标记

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 提取到 0 个域名 | 被踢回 3ue 控制面板 | 脚本已有 handle3ueRedirect() 自动处理 |
| 翻页超时 | 未加 perdomain=1 参数 | URL 加 `&perdomain=1` |
| Cloudflare 拦截 | 用了 headless 模式 | 必须 headed + stealth |
| a.href 提取的全是 semrush 域名 | Semrush 内部链接 | 用 aria-label 或链接文本提取 |

## 环境要求

- Node.js: /opt/homebrew/bin/node
- Playwright: 已安装在 workspace
- 代理: 127.0.0.1:7897
- 浏览器 profile: /Users/rain/.openclaw/workspace/browser-profiles/3ue
