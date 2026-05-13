# 基础架构稳定性验证 - 2026-02-23

**验证时间**: 2026-02-23 18:45
**目标**: 验证多实例 Telegram Bot 连接和 fallback 机制

---

## ✅ 验证结果

### 1. Gateway 状态

**主实例（main）：**
- ✅ Gateway 运行中（PID: 56606）
- ✅ 端口：18789
- ✅ HTTP 响应正常

**LaunchAgent 状态：**
```
com.apple.ap.promotedcontentd  0
com.apple.synapse.contentlinking  9
com.openclaw.gateway 56606 0
```

⚠️ **发现问题**：backlink、content、monitor 实例配置文件不存在！

---

### 2. Telegram Bot 配置

**已配置的 Bots：**
- ✅ `default` - 8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk`
- ✅ `research` - 8513427490:AAGGOzVsWqko5NEcXn1GbanEIo33Ept8FC0`
- ✅ `coding` - 8300082824:AAEu9cGy-d6cVjAjGHxkEcEbH0Y94EloUJs`

**配置策略**：
- `dmPolicy`: "pairing" - 需要配对
- `groupPolicy`: "allowlist" - 需要加入白名单

---

### 3. 多实例现状

**已发现**：
- ❌ backlink、content、monitor 实例配置文件不存在
- ⚠️ synapse.contentlinking 实例在运行（PID: 9），但没有对应的配置文件
- ✅ 只有一个 main 实例实际在运行

**可能原因**：
- 之前创建的 backlink/content/monitor 实例可能被清理或迁移
- LaunchAgent plist 残留，但配置文件丢失

---

## 🔴 需要解决的问题

### 1. 多实例配置缺失

**问题**：
```
~/.openclaw-backlink/openclaw.json - 不存在
~/.openclaw-content/openclaw.json - 不存在
~/.openclaw-monitor/openclaw.json - 不存在
```

**影响**：
- 无法使用 backlink、content、monitor 实例
- provider-switch.sh 配置路径错误
- auto-proxy.sh 配置路径错误

### 2. Telegram Bot 配置未完成

**问题**：
- 有 3 个 bot token，但没有为每个实例配置
- main 实例使用 default bot
- backlink/content/monitor 实例没有配置 bot

**影响**：
- 无法单独控制每个实例
- 实例间无法独立通信

### 3. LaunchAgent 残留

**问题**：
```
com.apple.synapse.contentlinking  9  # 没有对应配置
```

**影响**：
- 资源泄漏
- 可能导致端口冲突

---

## 🎯 修复计划

### Phase 1: 清理残留实例（立即）

1. 停止残留 LaunchAgent
2. 清理残留 plist 文件
3. 验证只剩 main 实例

### Phase 2: 重新评估多实例需求（30 分钟）

**问题**：
1. 是否真的需要 4 个独立实例？
2. 一个实例能否满足所有需求？
3. 多实例带来的维护成本是否值得？

**决策点**：
- 如果不需要，清理所有多实例配置
- 如果需要，重新创建并测试

### Phase 3: 配置 Telegram Bot（如需要）

**选项 A**：所有实例共用一个 bot
- 优点：配置简单
- 缺点：无法单独控制

**选项 B**：每个实例独立 bot
- 优点：完全独立
- 缺点：配置复杂

---

## 📊 当前架构状态

```
┌─────────────────────────────────────┐
│  OpenClaw Multi-Instance Status   │
├─────────────────────────────────────┤
│  Main Instance: ✅ Running      │
│  - Gateway: 18789              │
│  - Telegram: default bot          │
│  - Fallbacks: 4 models          │
├─────────────────────────────────────┤
│  Other Instances: ❌ Missing     │
│  - backlink: Config lost          │
│  - content: Config lost           │
│  - monitor: Config lost           │
└─────────────────────────────────────┘
```

---

## 🧪 验证方法

### 测试 API Failover

```bash
# 方法 1: 测试当前主模型
~/.openclaw/api-test.sh

# 方法 2: 查看 fallback 配置
openclaw models fallbacks list

# 方法 3: 模拟主模型失败
#（需要手动设置错误的 API key，然后测试 fallback）
```

### 测试 Telegram Bot

```bash
# 发送测试消息到每个 bot
# default: 8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk
# research: 8513427490:AAGGOzVsWqko5NEcXn1GbanEIo33Ept8FC0
# coding: 8300082824:AAEu9cGy-d6cVjAjGHxkEcEbH0Y94EloUJs
```

---

## 📝 下一步行动

**选项 A：先清理再重建**
1. 停止残留 LaunchAgent
2. 清理残留配置
3. 重新评估是否真的需要多实例

**选项 B：直接修复多实例**
1. 重新创建 backlink/content/monitor 配置
2. 配置独立的 Telegram Bot
3. 测试所有实例

**选项 C：简化为单实例**
1. 清理所有多实例配置
2. 只保留 main 实例
3. 配置所有功能到一个实例

---

**验证时间**: 2026-02-23 18:45
**发现的关键问题**: 多实例配置文件丢失，需要重建或简化
