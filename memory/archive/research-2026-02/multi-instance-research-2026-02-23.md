# 多实例最佳实践调研 - 2026-02-23

**调研时间**: 2026-02-23 19:00
**来源**: OpenClaw 官方文档 + GitHub + 社区讨论

---

## 📚 核心发现

### 1. 官方推荐架构：单实例 + 多 Agent

**OpenClaw 官方文档（docs.openclaw.ai）明确推荐：**
```
一个 Gateway + 多个独立 Agent（而非多个 Gateway）

优势：
- ✅ 资源利用率更高（共享 Gateway 进程）
- ✅ 配置简单（只有一个 openclaw.json）
- ✅ 状态管理统一（一个 session store）
- ✅ 避免 auth/profile 冲突
- ✅ 降低维护成本
```

**关键设计原则：**
```
不要运行多个 Gateway！

如果你需要"隔离"，使用：
- 独立的 Agent Workspace（agents.list 中的多个 agent）
- Agent 绑定到不同 Telegram Bot
- Agent 绑定到不同 WhatsApp 账户
- Agent 通过 bindings 路由到不同的 topic/group
```

---

## 🎯 社区最佳实践总结

### 实践 1：多 Agent 而非多 Gateway

**来源**: Reddit - r/LocalLLM / Dev.to

**推荐配置**：
```json
{
  "agents": {
    "list": [
      {
        "id": "home",
        "default": true,
        "name": "Home",
        "workspace": "~/.openclaw/workspace-home",
        "model": {
          "primary": "anthropic/claude-sonnet-4-5-20251022"
        }
      },
      {
        "id": "work",
        "name": "Work",
        "workspace": "~/.openclaw/workspace-work",
        "model": {
          "primary": "anthropic/claude-opus-4-6-20250219"
        }
      },
      {
        "id": "coding",
        "name": "Coding",
        "workspace": "~/.openclaw/workspace-coding",
        "model": {
          "primary": "openrouter/anthropic/claude-sonnet-4-5-20251022"
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "home",
      "match": {
        "channel": "telegram",
        "accountId": "personal"
      }
    },
    {
      "agentId": "work",
      "match": {
        "channel": "telegram",
        "accountId": "personal"
      }
    },
    {
      "agentId": "coding",
      "match": {
        "channel": "telegram",
        "accountId": "coding-bot"
      }
    }
  ]
}
```

**优势**：
- ✅ 一个 Gateway，多个独立 Agent
- ✅ 每个 Agent 有独立的 workspace 和 session store
- ✅ 通过 bindings 路由到不同账号/bot
- ✅ 灵活扩展，无需重启 Gateway

### 实践 2：避免多 Gateway 的常见问题

**来源**: Reddit - r/LocalLLM, StackOverflow

**问题列表**：

1. **Auth/Session 冲突**
   ```
   多个 Gateway 会共享 auth-profiles.json
   → 导致 Agent A 的 API key 被 Agent B 意外使用
   
   问题：难以追踪成本
   问题：Rate limit 影响所有 Gateway
   ```

2. **端口冲突**
   ```
   每个 Gateway 需要独立端口
   → 衍生端口（Gateway + Browser + Canvas）
   
   问题：端口耗尽
   问题：防火墙配置复杂
   ```

3. **状态管理混乱**
   ```
   多个 Gateway 各自维护 session store
   → 难以统一查看历史
   
   问题：调试困难
   问题：无法追踪跨 Agent 的任务
   ```

4. **资源浪费**
   ```
   每个 Gateway 都是独立的 Node.js 进程
   → 内存占用成倍增长
   
   问题：MacBook 性能下降
   问题：散热和电量问题
   ```

5. **LaunchAgent 维护噩梦**
   ```
   多个 Gateway = 多个 LaunchAgent plist
   → 残留进程，难以清理
   
   问题：僵尸进程
   问题：启动/停止混乱
   ```

### 实践 3：何时使用多 Gateway

**来源**: OpenClaw 官方文档

**唯一推荐场景**：
```
需要完全物理隔离时：
- 不同用户（多人共享一台 Mac）
- 不同生产环境（dev vs staging vs prod）
- 不同 VPS/云服务器

否则：
- 强烈建议使用单 Gateway + 多 Agent
```

---

## 🏆 最佳实践架构

### 推荐：单 Gateway + 多 Agent

```
┌─────────────────────────────────────┐
│       OpenClaw Gateway (单一)       │
│           端口: 18789             │
└──────────────┬──────────────────────┘
               │
     ┌───────┴─────────┬────────┐
     │                  │         │
   Agent:Home        Agent:Work  Agent:Coding
   Workspace:home    Workspace:work Workspace:coding
   Model:Sonnet      Model:Opus   Model:Code
   Bot:personal      Bot:personal Bot:coding
     │                  │         │
     └──────────────────┴─────────┘
               │
           Telegram (统一入口）
           /telegram
               │
     ┌───────┴────────┐
     │                │
   主人的 Telegram   主人的工作群
     │                │
   └────────────────┴─┘
```

**配置示例**：
```bash
# 1. 创建 Agent Workspace
mkdir -p ~/.openclaw/workspace-home
mkdir -p ~/.openclaw/workspace-work
mkdir -p ~/.openclaw/workspace-coding

# 2. 配置 agents.list
openclaw configure edit
# 添加 3 个 agent：home, work, coding

# 3. 为每个 Agent 配置独立的 Telegram Bot
openclaw channels add --channel telegram --token <home-bot-token>
openclaw channels add --channel telegram --token <coding-bot-token>

# 4. 配置 bindings 路由
openclaw configure edit
# 配置 home → personal Telegram
# 配置 work → personal Telegram  
# 配置 coding → coding-bot Telegram
```

---

## 📊 架构对比

| 维度 | 单 Gateway + 多 Agent | 多 Gateway（当前尝试） |
|------|---------------------|---------------------|
| 资源占用 | 低（1 个进程） | 高（4 个进程） |
| 配置复杂度 | 低（1 个 openclaw.json） | 高（4 个配置文件） |
| 维护成本 | 低（统一管理） | 高（分散管理） |
| 扩展性 | 高（添加 Agent 即可） | 低（需要新 Gateway） |
| 隔离性 | 中（通过 bindings） | 高（物理隔离） |
| 性能 | 优（共享资源） | 差（重复进程） |
| 推荐度 | ✅ 官方推荐 | ⚠️ 不推荐 |

---

## 🚨 当前问题诊断

### 发现的问题

**1. 配置文件丢失**
```
~/.openclaw-backlink/openclaw.json - 不存在
~/.openclaw-content/openclaw.json - 不存在
~/.openclaw-monitor/openclaw.json - 不存在
```

**2. LaunchAgent 残留**
```
com.apple.synapse.contentlinkingd  9
```
没有对应的配置文件，但 LaunchAgent 在运行。

**3. 我们的模式是反模式**
```
官方推荐：单 Gateway + 多 Agent
我们实现：多 Gateway + 单 Agent（实际上）
```

---

## 🎯 建议方案

### 方案 A：简化为单 Gateway + 多 Agent（强烈推荐）

**步骤**：

1. 停止所有多 Gateway LaunchAgent
2. 清理残留配置
3. 配置 3 个独立 Agent
4. 配置 bindings 实现路由

**优势**：
- ✅ 符合官方最佳实践
- ✅ 资源占用低
- ✅ 配置简单
- ✅ 维护成本小
- ✅ 扩展灵活

**缺点**：
- ⚠️ 需要重新设计架构
- ⚠️ 需要多个 Telegram Bot

---

### 方案 B：重建多 Gateway（保留现有模式）

**步骤**：

1. 重新创建 4 个实例的配置文件
2. 配置独立的 Telegram Bot
3. 修复 LaunchAgent

**优势**：
- ✅ 保持现有架构
- ✅ 物理隔离完整

**缺点**：
- ❌ 资源占用高
- ❌ 维护成本高
- ❌ 不符合官方推荐

---

### 方案 C：混合方案（平衡）

**建议**：
- 主实例：单 Gateway，3 个 Agent（home, work, coding）
- 专用实例：独立 Gateway（如 backlink 用于外链监控）

**架构**：
```
主实例（18789）：
  - Gateway: 运行中
  - Agents: 3 个（通过 bindings 路由）
  
专用实例（19000）：
  - Gateway: 仅在外链任务时启动
  - Agent: 1 个
```

---

## 📋 下一步决策点

需要你回答的问题：

1. **是否接受推荐方案 A（单 Gateway + 多 Agent）？**
   - 优点：性能优、维护简单、符合官方建议
   - 缺点：需要重新设计，需要多个 bot token

2. **是否继续方案 B（重建多 Gateway）？**
   - 优点：保持现有思路
   - 缺点：资源占用高、维护复杂

3. **是否尝试方案 C（混合）？**
   - 优点：平衡性能和隔离
   - 缺点：仍然复杂

4. **还是先做其他事情（如社媒监控）？**
   - 稳定性问题可以延后
   - 功能扩展优先级更高

---

## 📝 关键结论

**核心发现**：
1. OpenClaw 官方强烈推荐单 Gateway + 多 Agent
2. 多 Gateway 是反模式，除非需要完全物理隔离
3. 我们当前的问题是配置文件丢失 + LaunchAgent 残留
4. 最佳实践是使用 bindings 实现隔离，而非多个 Gateway

**认知提升**：
- 之前：多实例 = 多 Gateway（错误认知）
- 现在：多实例 = 多 Agent（正确认知）
- 官方架构：Gateway 只负责转发，业务逻辑由 Agent 处理

---

**调研完成时间**: 2026-02-23 19:00
**下一步**: 等你确认方案后执行
