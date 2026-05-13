---
name: OpenClawIncidentGuard
slug: openclaw-incident-guard
version: 1.0.0
description: OpenClaw 故障防重复执行规范。用于 Telegram/Feishu 无回复、no-mention、gateway 1006、spawn docker ENOENT、模型限流与 cron 渠道路由错配等问题的标准排查与修复。
metadata: {"clawdbot":{"emoji":"🛡️","requires":{"bins":["bash","openclaw","node","python3"]},"os":["darwin","linux","win32"]}}
---

## Scope

当出现以下任一症状时使用本技能：
- 群里 @agent 没回复
- 日志出现 `reason=no-mention`
- 日志出现 `spawn docker ENOENT`
- Gateway 间歇报 `1006`
- 模型报 `rate limit` / `No available auth profile` / `FailoverError`
- cron 发到了错误渠道（例如应发飞书却发 Telegram）

## Quick Start

1) 先抓快照（保留证据）：
```bash
bash /Users/shengdongyang/.openclaw/workspace/skills/openclaw-incident-guard/scripts/snapshot.sh
```

2) 跑标准诊断：
```bash
node /Users/shengdongyang/.openclaw/workspace/skills/bot-diagnostics/bot-doctor.js sweep --user <telegram_user_id> --probe --timeout 45
```

3) 对照故障目录修复：
- `references/incident-catalog.md`

4) 按 DoD 验收：
- `openclaw health` 连续成功
- 目标渠道有真实成功消息
- 最近 3-5 分钟无同类新报错

## Rules

1. 配置变更前必须备份 `~/.openclaw/openclaw.json`
2. 配置变更后必须校验 JSON，再重启 Gateway
3. 宣称修复前必须做真实渠道验证，不能只看 CLI 成功
4. 修复完成后必须写入 memory（根因/修复/证据/防再犯）
