# OpenClaw 配置对比检查 - 2026-02-23

**检查时间**: 2026-02-23 19:30
**目标**: 对比我们当前配置与 OpenClaw 官方最佳实践，发现差异

---

## 🔍 当前配置状态

### 1. Agent 列表

**实际情况**：
```
只发现 1 个 main Agent
其他 3 个（home/work/coding）在 agents.json 中，但没有对应的 agent 目录
```

**问题**：
- ❌ Agents.json 中定义了 3 个 Agent，但只有 main 有完整配置
- ❌ 缺少独立的 workspace 和 agent 目录
- ❌ 缺少独立的 session store
- ❌ 这样配置可能无法正常工作

### 2. 缺失的组件

**标准多 Agent 架构需要**：
```
每个 Agent 需要：
  1. ~/.openclaw/agents/<agentId>/agent/ 目录
     ├── AGENTS.md
     ├── SOUL.md
     ├── USER.md
     ├── TOOLS.md
     └── workspace/
  
  2. ~/.openclaw/agents/<agentId>/sessions/ 目录
     ├── (session files)
     └── (routing state)
  
  3. agents.json 中的完整定义
```

**我们缺少的**：
```
❌ Home Agent: 没有 agent 目录
❌ Work Agent: 没有 agent 目录
❌ Coding Agent: 没有 agent 目录
```

### 3. Bindings 配置

**当前 bindings**：
```json
"bindings": [
  {
    "agentId": "work",
    "match": {
      "channel": "telegram",
      "accountId": "research"
    }
  },
  {
    "agentId": "coding",
    "match": {
      "channel": "main"
      "accountId": "coding"
    }
  }
]
]
```

**问题**：
- ❌ coding 绑定到了 main channel（应该是 coding-bot）
- ❌ home 没有配置 bindings
- ❌ 缺少 default 绑定

---

## 📚 与官方最佳实践的差距

### 差距 1: Agent 不完整

**官方要求**：
```markdown
每个 Agent 必须有：
- agent 目录（包含 SOUL.md、USER.md、TOOLS.md、workspace）
- session store
- 完整的 agents.json 定义
```

**我们的状态**：
```
✅ agents.json 中有定义
❌ 但只有 main 有完整目录结构
❌ 其他 3 个 Agent 只有定义，没有实体目录
```

**影响**：
- 可能导致 Agent 无法启动
- 可能导致 routing 失败
- 无法隔离 session 和 memory

### 差距 2: Bindings 路由不完整

**官方最佳实践**：
```markdown
完整的 bindings 示例：
"bindings": [
  {
    "agentId": "work",
    "match": {
      "channel": "telegram",
      "accountId": "bot-1"
    }
  },
  {
    "agentId": "coding",
    "match": {
      "channel": "telegram",
      "accountId": "bot-2"
    }
  },
  {
    "---
    "agentId": "home",
    "match": {
      "channel": "telegram",
      "accountId": "default"
    }
  }
]
```

**我们的问题**：
```
❌ coding 绑定到 main channel（错误）
❌ home 没有绑定
❌ coding-bot 在 bindings 中不存在
❌ research-bot 在 bindings 中不存在
```

### 差距 3: 模型配置不一致

**问题**：
```
❌ 3 个 Agent 都配置了主模型 zhipu-anthropic/claude-sonnet-4-5-20251022
❌ 但 fallbacks 列表完全相同
```

**应该是**：
```markdown
Home Agent: 适合 Claude Sonnet 4.5，偏重对话和日常任务
  fallbacks: [
    "anthropic/claude-sonnet-4-5-20251022",
    "openrouter/anthropic/claude-sonnet-4-5-20251022"
  ]

Work Agent: 适合分析和总结
  fallbacks: [
    "openrouter/anthropic/claude-sonnet-4-5-20251022"
  ]

Coding Agent: 适合代码审查和技术问题
  fallbacks: [
    "openrouter/anthropic/claude-sonnet-4-5-20251022"
  ]
```

---

## 🎯 问题根源

### 1. 配置方式错误

**我们是怎么做的**：
```bash
# 直接编辑 ~/.openclaw/agents.json
# 添加了 3 个 Agent 定义
# 没有创建对应的 agent 目录
# 没有创建对应的 session store
```

**正确做法应该是**：
```bash
# 使用 OpenClaw 提供的命令
openclaw agents add
# 交互式创建 Agent
# 自动生成完整的目录结构和配置
```

### 2. 绑定配置混乱

**我们是怎么做的**：
- coding 绑定到了 main channel（应该绑定到 coding-bot）
- home 没有绑定（应该绑定到 default）
- coding-bot 和 research-bot 不在 bindings 中

**正确做法应该是**：
```bash
# 1. 先通过 BotFather 创建额外的 bot
# 2. 然后配置 bindings
openclaw channels add --channel telegram --token <coding-bot-token>
openclaw channels add --channel telegram --token <research-bot-token>
openclaw configure edit
# 配置 bindings
```

### 3. 模型配置缺少差异化

**当前问题**：
- 所有 Agent 都用相同的主模型
- 所有 Agent 都有相同的 fallbacks
- 失去了 Agent 专用的价值

**应该怎么做**：
- Home Agent: 偏重对话能力，用 Sonnet 4.5
- Work Agent: 偏重分析能力
- Coding Agent: 偏重技术能力
- 每个 Agent 配置不同的 fallback 策略

---

## 🔄 修复建议

### Phase 1: 修复 Agent 目录结构（立即）

**问题**：
- 3 个 Agent 只有定义，没有实体目录
- 可能导致 Agent 无法正常启动

**解决方案**：
```bash
# 删除错误的 Agent 定义
openclaw configure edit

# 使用正确的方式重新创建
openclaw agents add
# 为每个 Agent 创建完整结构
```

**或者，临时方案**：
```bash
# 手动创建缺失的目录
mkdir -p ~/.openclaw/agents/home/agent
mkdir -p ~/.openclaw/agents/work/agent  
mkdir -p ~/.openclaw/agents/coding/agent

# 复制配置文件
cp ~/.openclaw/agents/main/agent/AGENTS.md ~/.openclaw/agents/home/agent/
cp ~/.openclaw/agents/main/agent/SOUL.md ~/.openclaw/agents/home/agent/
cp ~/.openclaw/agents/main/agent/USER.md ~/.openclaw/agents/home/agent/
cp ~/.openclaw/agents/main/agent/TOOLS.md ~/.openclaw/agents/home/agent/

# 复制 workspace
cp -r ~/.openclaw/agents/main/agent/workspace ~/.openclaw/agents/home/agent/
```

### Phase 2: 修复 Bindings 配置（30 分钟）

**问题**：
- coding 绑定到 main（应该是 coding-bot）
- coding-bot 不在 bindings 中
- research-bot 不在 bindings 中

**解决方案**：
```bash
# 验证当前 bot tokens
openclaw channels list

# 修正 coding 绑定
openclaw configure edit
# coding → coding-bot

# 添加缺失的 bindings
# home → default
```

### Phase 3: 优化模型配置（1 小时）

**问题**：
- 所有 Agent 都用相同配置
- 失去了专业化价值

**解决方案**：
```bash
# 为每个 Agent 配置不同的模型和 fallbacks
openclaw configure edit

Home Agent:
  - primary: anthropic/claude-sonnet-4-5-20251022
  - fallbacks: [
      "anthropic/claude-sonnet-4-5-20251022",
      "openrouter/anthropic/claude-sonnet-4-5-20251022"
    ]

Work Agent:
  - primary: openrouter/anthropic/claude-sonnet-4-5-20251022
  - fallbacks: [
      "moonshot/moonshot-v1-128k",
      "codesome/claude-sonnet-4-5-20251022"
    ]

Coding Agent:
  - primary: openrouter/claude-sonnet-4-5-2025-2025-04-24
  - fallbacks: [
      "openrouter/claude-sonnet-4-5-20251022",
      "codesome/claude-opus-4-6-20250219"
    ]
```

---

## 📊 预计效果

### 修复前 vs 修复后

| 维度 | 修复前 | 修复后 | 改善 |
|------|--------|--------|------|
| Agent 稳定性 | ❌ 可能无法启动 | ✅ 完整配置 | ⭐⭐⭐ |
| Bindings 正确性 | ❌ 路由混乱 | ✅ 正确路由 | ⭐⭐⭐ |
| 模型差异 | ❌ 全部相同 | ✅ 按需配置 | ⭐⭐ |
| 业务隔离 | ❌ 无法隔离 | ✅ 完全隔离 | ⭐⭐⭐ |
| 维护成本 | 低 | 低（多 Agent 复杂） | ⭐⭐⭐ |

---

## 🚨 发现的关键问题

### 问题 1: 我们一直在用"快速但不正确"的方式

**示例**：
```bash
# 快速方式（我们当前）
openclaw configure edit
# 直接编辑 JSON，手动创建目录

# 慢速但不正确
# Agent 可能无法启动
# 目录结构可能不完整
```

**正确方式**：
```bash
# 使用 OpenClaw 提供的命令
openclaw agents add
# 交互式创建，保证完整性
```

### 问题 2: 缺少"前期验证"

**我们缺少的步骤**：
1. 验证配置是否符合官方规范
2. 测试 Agent 是否能正常启动
3. 测试 bindings 是否正确路由
4. 测试 fallback 是否按预期工作

**这导致**：
- 部署后才发现问题
- 需要反复调试
- 增加了试错成本

---

## 📝 建议的完整流程

### 标准的"正确方式"

**Step 1: 使用官方命令创建**
```bash
# 1. 创建 Home Agent
openclaw agents add
# 输入：home
# 选择：独立 workspace
# 配置：模型 + fallbacks

# 2. 创建 Work Agent
openclaw agents add
# 输入：work
# 选择：独立 workspace
# 配置：模型 + fallbacks

# 3. 创建 Coding Agent
openclaw agents add
# 输入：coding
# 选择：独立 workspace
# 配置：模型 + fallbacks
```

**Step 2: 配置 Bindings**
```bash
# 验证所有 bot tokens
openclaw channels list

# 配置正确的 bindings
openclaw configure edit
```

**Step 3: 测试验证**
```bash
# 测试每个 Agent 独立响应
# 测试 bindings 路由
# 测试 fallback 机制
```

**Step 4: 文档化**
```bash
# 更新 TODO.md
# 记录架构决策
# 记录配置方式
```

---

## 🎯 关键认知

### 核心教训

**之前的问题**：
1. ❌ 追求速度，忽略正确性
2. ❌ 直接编辑配置文件，不使用官方工具
3. `缺乏前期验证，导致频繁试错`

**应该怎么改**：
1. ✅ 优先正确性，再考虑速度
2. ✅ 使用 OpenClaw 官方命令，避免手动编辑
3. ✅ 每个步骤都要验证
4. ✅ 先小规模测试，再全面部署

---

## 📋 下一步行动

### 立即修复（推荐）

**选项 A：手动补全目录结构**（5-10 分钟）
- 创建缺失的 agent 目录
- 复制配置文件
- 快速修复

**选项 B：删除并重建**（15-30 分钟）
- 删除错误的 Agent 定义
- 使用官方命令重新创建
- 保证完整性

**选项 C：先测试现有配置**（5 分钟）
- 先测试 main Agent 是否正常
- 测试 bindings 是否正常路由
- 决定修复方向

---

## 📊 配置健康度评估

### 当前状态评分

| 维度 | 评分 | 说明 |
|------|------|------|
| Agent 完整性 | ⭐⭐ | 只有 main 完整，其他 3 个不完整 |
| Bindings 正确性 | ⭐ | coding 路由错误 |
| 模型差异化 | ⭐ | 全部相同 |
| 符合官方规范 | ⭐⭐ | 部分符合，但缺少验证 |
| 可维护性 | ⭐⭐⭐ | 配置复杂，但结构清晰 |

---

**总体评分**: ⭐⭐⭐ / 5

**主要问题**：
1. Agent 目录不完整（3/4 缺失）
2. Bindings 路由错误（coding 绑定到 main）
3. 模型配置未差异化
4. 缺少前期验证

**建议**：
立即修复配置，然后再添加新功能

---

**检查完成时间**: 2026-02-23 19:30
**下一步**: 等你确认修复方案
