# OpenClaw Incident Prevention - 2026-02-27

## 目标
把近期重复故障沉淀为固定流程，避免“同一问题反复修”。

## 这轮聊天里反复出现的问题
1. Telegram 群 @agent 无回复，日志出现 `reason=no-mention`。
2. 入口 bot 与角色命名不一致，群内文案仍引用旧 bot 名称，导致调用混乱。
3. `spawn docker ENOENT` 导致 agent 在回复前失败。
4. Gateway 间歇 `1006`，CLI 探测偶发 unreachable。
5. 模型不可用/限流（`API rate limit`、`No available auth profile`）导致“看起来像不回复”。
6. cron 渠道路由错配（预期飞书，实际仍发 Telegram）。
7. workspace 骨架不一致（如缺 `memory/active-task.md`）引发巡航/派单超时。
8. Browser Relay 显示可达但目标 agent 浏览器能力不可用。
9. exec/sandbox 认知混乱（主 agent 与子 agent权限边界不清）。

## 强制执行的防再犯规则
1. 每次事故先跑快照：`bash ~/.codex/skills/openclaw-incident-guard/scripts/snapshot.sh`
2. 每次改 `~/.openclaw/openclaw.json` 必做：
   - 先备份
   - 校验 JSON
   - 再重启 Gateway
3. 每次宣称“修复完成”前必须有真实渠道验证：
   - Telegram/Feishu 实发一条消息并收到回应
4. 入口 agent（main）必须覆盖所有常用提及别名（中文、英文、全角 @）。
5. 关键 agent（main/coding）必须保持至少两层 fallback，避免单 provider 故障。
6. cron 变更必须执行 `list -> delete old -> add new -> list` 四步闭环。
7. 统一 7 个 agent 的 workspace 骨架文件，缺失即补齐，不允许拖延。

## 标准验收（DoD）
1. `openclaw health` 连续两次成功。
2. 目标渠道出现成功发送日志（例如 `sendMessage ok`）。
3. 最近 3-5 分钟无同类新错误。
4. 事故根因、修复、证据和新护栏已写入 memory。

## 后续执行入口
- Skill: `~/.codex/skills/openclaw-incident-guard/SKILL.md`
- OpenClaw Skill: `~/.openclaw/workspace/skills/openclaw-incident-guard/SKILL.md`
- 事故目录: `~/.codex/skills/openclaw-incident-guard/references/incident-catalog.md`
