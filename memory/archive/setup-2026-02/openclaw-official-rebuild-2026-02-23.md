# OpenClaw 官方式重建 - 2026-02-23

**重建时间**: 2026-02-23 19:40
**目标**: 按照 OpenClaw 官方方式重建多 Agent 架构

---

## 🔄 执行步骤

### Step 1: 清理错误配置

**删除错误的 Agent 定义**：
```bash
openclaw configure edit
# 删除 home/work/coding Agent（只保留 main）
```

**原因**：
- ❌ Agent 目录不完整（3/4 个只有定义）
- ❌ 绑定配置错误（coding → main channel）
- ❌ 模型配置未差异化
- ❌ 使用手动编辑方式，不符合官方最佳实践

---

### Step 2: 用官方命令创建 Agent

**2.1 创建 Work Agent**
```bash
openclaw agents add
# 输入：work
# 选择：独立 workspace
# 配置模型：openrouter/anthropic/claude-sonnet-4-5-20251022
# 配置 fallbacks：moonshot/moonshot-v1-128k
```

**2.2 创建 Coding Agent**
```bash
openclaw agents add
# 输入：coding
# 选择：独立 workspace
# 配置模型：openrouter/anthropic/claude-sonnet-4-5-20251022
# 配置 fallbacks：moonshot/moonshot-v1-128k, kimi/kimi-for-coding
```

**2.3 配置 Bindings**
```bash
openclaw channels add --channel telegram --token <coding-bot-token>
openclaw channels add --channel telegram --token <work-bot-token>

openclaw configure edit
# 添加 bindings
```

---

### Step 3: 验证配置

**验证点**：
- [ ] 3 个 Agent 都能独立响应
- [ ] Bindings 正确路由（work → coding-bot, coding → coding-bot）
- [ ] 模型差异化配置（work 侧重分析，coding 侧重技术）
- [ ] main Agent 只负责默认路由

---

## 📋 预期架构

```
┌─────────────────────────────────────┐
│  OpenClaw Gateway (18789)       │
│           端口: 本地                  │
└─────────────────────────────────────┘
                                      │
     ┌──────────┬─────────┐
     │  Agent: Home        │
     │  Workspace: workspace-home │
     │  Bot: default         │
     │  Model: Sonnet 4.5 + 3 fallbacks │
     └──────────┴─────────┘
              │
     ┌──────────┬─────────┐
     │  Agent: Work        │
     │  Workspace: workspace-work │
     │  Bot: research       │
     │  Step 4: 技术助手 │
     │  Model: Sonnet 4.5 + 2 fallbacks │
     └──────────┴─────────┘
              │
     ┌──────────┬─────────┐
     │  Agent: Coding       │
     │  Workspace: workspace-coding │
     │  Bot: coding-bot      │
     │  Purpose: 代码审查     │
     │  Model: Sonnet 4.5 + 4 fallbacks │
     └──────────┴─────────┘
                                      │
     ┌──────────┬─────────┐
     │  Agent: Main (default) │
     │  Bot: [all]          │
     │  │
     │  │  路由到不同 Agent │
     └──────────┴─────────┘
                                      │
└─────────────────────────────────────┘
```

---

## 🎯 优势

### 1. 符合官方最佳实践
- ✅ 使用 openclaw agents add 命令创建
- ✅ 保证配置结构完整
- ✅ 避免手动编辑引入错误

### 2. 清晰的业务隔离
- ✅ Home: 家庭助手
- ✅ Work: 工作助手  
- ✅ Coding: 技术助手
- ✅ Main: 默认路由

### 3. 灵活的 bindings
- ✅ work → research bot
- ✅ coding → coding-bot
- ✅ home → default bot
- ✅ main → 所有 bot（默认路由）

### 4. 模型差异化
- ✅ Work: 2 个 fallbacks（侧重稳定）
- ✅ Coding: 4 个 fallbacks（侧重成本和速度）

### 5. 扩展性强
- ✅ 新增 Agent：用 agents add 命令即可
- ✅ 新增 Bot：用 channels add 命令即可
- ✅ 无需重启 Gateway

---

## ⚠️ 保留的 main Agent 配置

**当前 main Agent**：
```json
{
  "model": {
    "primary": "zhipu-anthropic/claude-sonnet-4-5-20251022",
    "fallbacks": [
      "codesome/claude-sonnet-4-5-20251022",
      "moonshot/moonshot-v1-128k",
      "friend/claude-sonnet-4-5-20251022",
      "kimi/kimi-for-coding"
    ]
  }
}
```

**Fallback 机制**：
- ✅ 已启用，自动按顺序切换
- ✅ 主模型失败时自动尝试备用
- ✅ Session 级缓存，避免频繁切换

---

## 📝 验证步骤

### 验证 1: 创建前状态
```bash
openclaw agents list
openclaw channels list
openclaw channels status --probe
```

### 验证 2: 创建 Agent 后
```bash
openclaw agents list
openclaw channels list
openclaw channels status --probe
```

### 验证 3: Bindings 路由测试
- [ ] work Agent → research bot
- [ ] coding Agent → coding-bot
- [ ] home Agent → default bot
- [ ] main Agent → 所有 bot（默认）

---

## 🚀 下一步

需要你提供：

1. **coding-bot Token**：用于 Coding Agent 的独立 Telegram Bot
2. **research-bot Token**：用于 Work Agent 的独立 Telegram Bot  
3. **确认 Agent 列表**：是否同意这个分工

**然后我执行**：
1. 清理错误的 Agent 定义
2. 创建 Work 和 Coding Agent
3. 配置 Bindings
4. 验证配置

---

**重建开始时间**: 2026-02-23 19:40
