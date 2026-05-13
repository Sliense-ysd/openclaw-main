# Competitor Backlinks Skill

扫描竞品站的外链，发现我们没有覆盖的外链机会。

## 功能

### 竞品外链扫描
- 从 Semrush 提取 19 个竞品站的引荐域名
- 与我们所有飞书表（日常统计、付费外链、收录统计）对比
- 找出竞品有但我们没有的外链机会
- 写入「竞品站外链」表

## 竞品站列表

```
seedance20.net
seedance2.ai
seedance2ai.org
seedance-2.net
seedance-2.app
seedance2.today
aiseedance2.ai
ai-seedance.org
aiseedance2.net
see-dance2.org
seedance2pro.io
seadance.io
seedance20.site
seedance2ai.co
seedanceai2.org
seedance2ai.video
seedance2video.io
seeddance.io
seedance2ai.online
```

## 使用方法

### 手动执行

```bash
cd /Users/rain/.openclaw/workspace
node scripts/semrush-extract-competitors.mjs
node scripts/competitor-backlinks.mjs
```

### 定时任务

每天 08:00 自动执行：

```json
{
  "name": "竞品外链扫描",
  "schedule": {
    "kind": "cron",
    "expr": "0 8 * * *",
    "tz": "Asia/Shanghai"
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "执行竞品外链扫描"
  },
  "delivery": {
    "mode": "announce",
    "channel": "telegram"
  }
}
```

## 数据流程

1. **提取竞品引荐域名** → `data/semrush-refdomains-competitors.json`
2. **对比我们的所有表**：
   - 日常统计 (tblaMsBwA96hAgfR)
   - 付费外链 (tblBynzoIFH4OHp8)
   - 收录统计 (tblNJSvkynCSZjtG)
3. **差集写入** → 竞品站外链表 (tbl4LmNloqRul4eC)

## 飞书表结构

**竞品站外链表** (tbl4LmNloqRul4eC)
- 字段：外链（纯文本）

## 环境要求

- Node.js: /opt/homebrew/bin/node
- Playwright: 已安装在 workspace
- 代理: 127.0.0.1:7897
- 浏览器 profile: /Users/rain/.openclaw/workspace/browser-profiles/3ue
