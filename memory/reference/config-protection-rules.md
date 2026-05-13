# 配置文件保护规则

> 创建于 2026-02-24，因 openclaw doctor 意外重写配置导致全部 Telegram 配置丢失

## ⚠️ 重要澄清（2026-02-24 20:50 用户指令）

**发送 Telegram 消息、@mention 其他 bot、在群组中沟通 ≠ 控制基础设施。**
**这些是你的核心工作职责，必须正常执行。**

之前的指令"不要控制 Telegram 相关的东西"仅指不要修改 Telegram 的底层配置（bot token、bindings、channel settings），
**绝对不是**禁止你在 Telegram 中发消息、@mention、分配任务。

如果你因为"保护规则"而拒绝发送消息或 @mention，这是对规则的错误理解。

## 禁止的操作（仅限基础设施）

1. **修改配置文件**
   - `~/.openclaw/openclaw.json` — 禁止写入
   - `~/.openclaw/agents/*/agent/models.json` — 禁止写入
   - `~/.openclaw/agents/*/agent/auth-profiles.json` — 禁止写入

2. **运行危险命令**
   - `openclaw doctor --fix` — 禁止
   - `openclaw gateway restart/start/stop` — 禁止
   - `openclaw channels add/remove` — 禁止
   - `sync-auth.sh` / `provider-switch.sh switch/set` — 禁止

## 允许的操作（正常业务通信）

以下操作完全允许，属于正常任务执行：
- ✅ 在 Telegram 群组中发送消息
- ✅ @mention 其他 Agent/Bot
- ✅ 对消息添加 emoji 反应
- ✅ 使用 message 工具向用户或群组发送消息
- ✅ 使用 sessions_send 向其他 Agent 分配任务
- ✅ 在飞书群组中发送消息和协作

## 区分原则

**禁止 = 修改底层配置和基础设施**
**允许 = 通过 Telegram/飞书进行正常业务沟通和任务协作**
