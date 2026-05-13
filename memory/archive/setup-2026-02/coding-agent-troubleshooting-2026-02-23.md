# coding Agent 问题排查 - 2026-02-23

**时间**: 2026-02-23 22:25
**问题**: coding Agent 没有响应

---

## 🔍 已确认的信息

### ✅ 配置正确
1. **Bindings 配置**：
   - agentId: "coding"
   - match: channel="telegram", accountId="coding"

2. **Telegram accounts 配置**：
   - accountId: "coding"
   - botToken: 8300082824:AAEu9cGy-d6cVjAjGHxkEcEbH0Y94EloUJs
   - Bot 名称: @DDawson2Bot

3. **Agent 配置**：
   - id: "coding"
   - name: "coding"
   - workspace: ~/.openclaw/workspace-coding
   - model: kimi/kimi-for-coding

### ✅ Gateway 日志确认
```
[telegram] [coding] starting provider (@DDawson2Bot)
```

说明 coding Agent 的 Telegram provider 已经启动。

### ⚠️ 问题发现
- coding Agent 的 sessions 目录是空的（没有收到任何消息）
- 所有会话都是 main Agent 的会话

---

## 🤔 可能的原因

### 原因 1：Bot 未绑定到你的账户
**可能情况**：
- 你创建了 Bot，但没有"绑定"到你的 Telegram 账户
- Bot 需要你点击"Start"才能开始工作

**解决方法**：
1. 在 Telegram 中搜索 @DDawson2Bot
2. 点击 "Start" 按钮
3. 确认 Bot 已启动

---

### 原因 2：Bot Token 可能不正确
**可能情况**：
- Bot Token 可能是之前创建的 DDawson1Bot
- 而不是真正的 DDawson2Bot

**解决方法**：
1. 检查 BotFather 中 DDawson2Bot 的 Token
2. 确认是否是：8300082824:AAEu9cGy-d6cVjAjGHxkEcEbH0Y94EloUJs

---

### 原因 3：Bot 配置问题
**可能情况**：
- dmPolicy: "pairing" - 需要先配对
- groupPolicy: "allowlist" - 只允许白名单群组

**解决方法**：
- 检查是否需要先配对 Bot
- 检查是否在白名单中

---

## 🎯 建议的排查步骤

### 步骤 1：检查 Bot 是否已启动
1. 在 Telegram 中搜索 @DDawson2Bot
2. 点击 "Start" 按钮
3. 发送消息："Hello"

### 步骤 2：检查 Bot Token
1. 在 Telegram 中搜索 @BotFather
2. 查询 DDawson2Bot 的 Token
3. 确认是否是正确的 Token

### 步骤 3：检查 Bindings 路由
1. 查看 Gateway 日志：`openclaw logs --follow`
2. 发送消息到 @DDawson2Bot
3. 观察是否有路由错误

---

## 📋 下一步

**优先级 1**：
- 检查 @DDawson2Bot 是否已启动
- 发送消息："Hello"
- 观察是否有回复

**优先级 2**：
- 检查 Bot Token 是否正确
- 如有需要，重新获取 Token

**优先级 3**：
- 检查 dmPolicy 和 groupPolicy 配置

---

**创建时间**: 2026-02-23 22:25
