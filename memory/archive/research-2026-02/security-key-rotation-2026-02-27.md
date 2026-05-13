# 密钥轮换与泄露处置清单（2026-02-27）

## 事件摘要
- 发现时间：2026-02-27（GMT+8）
- 扫描文件数：200
- 命中潜在敏感信息文件数：20
- 根因：子 agent 曾读取并回显全局配置，导致会话日志出现明文密钥/Token。

## 已完成的即时止血（已实施）
- [x] 将 `agents.defaults.sandbox.mode` 从 `off` 调整为 `non-main`。
- [x] 为 6 个子 agent 的 `AGENTS.md` 添加系统权限护栏（禁读全局配置、禁重启网关）。
- [x] 为主 agent 的 `AGENTS.md` 添加“敏感配置最小读取 + 脱敏输出”规范。
- [x] 收紧本地权限：`~/.openclaw/logs`、`~/.openclaw/agents/*/sessions/*` 仅 owner 可读写。

## 高风险文件（Top 12）
| 文件 | 命中统计 |
|---|---|
| /Users/shengdongyang/.openclaw/agents/main/sessions/30eab6f7-c84a-47d3-a500-b6e4a631ee70.jsonl | sk:35, cr:11, zhipu:21, telegram:113 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/f6ef4ac2-8152-425f-95ce-7ae38a6571af.jsonl | sk:27, cr:5, zhipu:17, telegram:79 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/4568150f-989e-4358-945e-71608992af9e.jsonl | sk:8, cr:7, zhipu:8, telegram:30 |
| /Users/shengdongyang/.openclaw/agents/product/sessions/5c138c65-fa27-4b04-a08f-5663f92d6969.jsonl | sk:17, cr:3, zhipu:6, telegram:7 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/dbdbc80e-747b-4724-a91f-1270b7276beb.jsonl | sk:2, cr:8, zhipu:2, telegram:13 |
| /Users/shengdongyang/.openclaw/agents/coding/sessions/e5efa7fa-761a-4480-9792-7bb3de2fb69d.jsonl | sk:3, cr:1, zhipu:2, telegram:14 |
| /Users/shengdongyang/.openclaw/agents/coding/sessions/34a0c247-b3ec-451b-ba5e-b242575a33b0.jsonl | sk:3, cr:1, zhipu:2, telegram:7 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/8b8185ab-0737-4f6e-8e48-75acfbaa2596.jsonl | sk:12 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/2db5bf86-dcbe-45f5-9acd-359fe42450f8.jsonl | telegram:6 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/d6f2e775-61e7-411c-a53a-5af019a11cef.jsonl | telegram:6 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/a909b4da-d81a-4ca1-8cd4-1bc8ecafcac2.jsonl | sk:4 |
| /Users/shengdongyang/.openclaw/agents/main/sessions/00683228-75b3-4309-bee1-33178f43601d.jsonl | telegram:3 |

## P0 轮换清单（24小时内）
- [ ] 轮换 LLM Provider 密钥：`kimi`、`moonshot`、`friend`、`zhipu-anthropic`、`bailian`、`codesome`。
- [ ] 轮换 Telegram 机器人 token（main/coding/research/product/growth/operations/backlink）。
- [ ] 轮换 Feishu 应用密钥（如已写入本机配置或日志）。
- [ ] 更新 `~/.openclaw/openclaw.json` 后重启网关：`openclaw gateway restart`。
- [ ] 执行回归：`openclaw status`、`openclaw cron list`、群内 @ 每个 agent smoke test。

## 验证口径（轮换后）
- [ ] 在会话日志中再次扫描：不应出现新的明文 `apiKey/token`。
- [ ] 子 agent 被要求执行全局操作时，应拒绝并提示“请由主Agent执行此变更”。
- [ ] 巡航任务输出不再把“缺失文件”误报为 TIMEOUT。

## 注意
- 轮换不会清空 MEMORY/SOUL/USER，不会丢失业务记忆。
- 历史日志中已写入的旧密钥仍应视为泄露，必须完成轮换后才能算处置完成。
