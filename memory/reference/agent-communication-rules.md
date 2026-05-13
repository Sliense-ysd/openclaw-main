# Agent 间通信规则

> 2026-02-25 用户确认：Telegram bot 之间无法互相看到消息（Telegram 平台限制）

## 核心规则

**Telegram 是人机界面，sessions_send 是 Agent 间通信通道。**

## 如何给其他 Agent 分配任务

### 正确做法（两步）

1. **在 Telegram 群组发可见消息**（让用户知道）：
   ```
   message tool → channel: telegram, to: "-1003759411912"
   text: "正在将外链审计任务分配给 @BacklinkDDawsonBot"
   ```

2. **通过 sessions_send 实际传递任务**（这才是真正触发对方的方式）：
   ```
   sessions_send → sessionKey: "agent:backlink:telegram:group:-1003759411912"
   message: "请执行每日外链审计任务"
   ```

### 错误做法

❌ 只在 Telegram 群里 @mention 其他 bot — 对方收不到（Telegram 限制）
❌ 期望其他 bot 能看到你在群里发的消息 — 看不到

## Agent Session Key 格式

- `agent:<agentId>:telegram:group:<chatId>`
- 群组 chat ID: `-1003759411912`

## 各 Agent 的 Session Key

| Agent | Session Key |
|-------|-------------|
| main | agent:main:telegram:group:-1003759411912 |
| coding | agent:coding:telegram:group:-1003759411912 |
| research | agent:research:telegram:group:-1003759411912 |
| product | agent:product:telegram:group:-1003759411912 |
| growth | agent:growth:telegram:group:-1003759411912 |
| operations | agent:operations:telegram:group:-1003759411912 |
| backlink | agent:backlink:telegram:group:-1003759411912 |
| work | agent:work:telegram:group:-1003759411912 |

## 原因

Telegram 官方 FAQ：
> "Bots will not be able to see messages from other bots regardless of mode."

这是 Telegram 平台级限制，无法绕过。OpenClaw issue #408 已确认。
