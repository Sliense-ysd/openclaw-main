# OpenClaw 技能和最佳实践学习 - 2026-02-23

**学习时间**: 2026-02-23 20:20
**目标**: 研究 OpenClaw 高级技巧和高效工作流，提升认知

---

## 🔍 任务列表现状分析

### 🔴 P0 - 紧急任务

**一键初始化脚本**：
- [x] 代理检测（auto-proxy.sh）
- [ ] 启动所有 Gateway 实例
- [ ] 验证所有端口可达
- [ ] 验证 Telegram Bot 连接
- [ ] 初始化 Memory 和 Skills
- [ ] 打开 Web Dashboard
- [ ] 支持动态扩展

**API Key 自动轮换**：
- [x] 设计阶段（已完成：发现原生机制）
- [ ] 设计 API Key 池管理机制
- [ ] 设计健康检查 + 自动切换逻辑
- [ ] 实施并测试

**Gateway 稳定性**：
- [x] Guard、auto-proxy、caffeinate
- [ ] sudo pmset -c sleep 0（需要你手动）

### 🟡 P1 - 重要任务

**社媒监控体系**：
- [ ] 梳理现有社媒监控 Skills 能力
- [ ] 添加 X/Twitter 品牌提及监控
- [ ] 添加竞品社媒动态监控
- [ ] 监控结果汇总到飞书 Bitable

**多实例配置完善**：
- [x] 4 个 Profile 实例创建并运行
- [x] 独立 LaunchAgent + 端口隔离
- [ ] 配置 openclaw.json + workspace + SOUL.md
- [x] 5 个 cron 任务重建
- [ ] 测试各实例 Telegram Bot 连接
- [ ] 配置实例间通信机制

**修复 Browser Relay**：
- [ ] Chrome 扩展红色 ! 标记

### 🟢 P2 - 可延后

**Telegram 群组体系**：
- [x] 创建工作群：🦞 工作台
- [ ] 创建测试群、外链监控群

**学习资源**：
- [ ] awesome-openclaw-usecases 社区案例
- [ ] n8n 工作流编排调研

---

## 📚 OpenClaw 高级技巧和最佳实践

### 1. 效率提升技巧

#### 技巧 1：智能模型分配（Cost Control）

**来自社区实践**：
- 使用 `agents.defaults.model.primary` 为每个 Agent 配置不同主模型
- 使用 `fallbacks` 配置多级备用
- 任务类型 vs 模型选择：
  - **深度推理** → Opus 4.6（高成本，高质量）
  - **快速响应** → Sonnet 4.5（中等成本，速度快）
  - **代码审查** → Kimi For Coding（低成本）
  - **批量任务** → Moonshot 128K（成本优化）

**实施方法**：
```json
// Work Agent（偏分析和总结）
{
  "id": "work",
  "model": {
    "primary": "anthropic/claude-opus-4-6-20250219",
    "fallbacks": [
      "anthropic/claude-sonnet-4-5-20251022",
      "moonshot/moonshot-v1-128k"
    ]
  }
}

// Coding Agent（偏代码审查）
{
  "id": "coding",
  "model": {
    "primary": "kimi/kimi-for-coding",
    "fallbacks": [
      "openrouter/anthropic/claude-sonnet-4-5-20251022",
      "moonshot/moonshot-v1-128k"
    ]
  }
}

// Home Agent（偏日常对话）
{
  "id": "home",
  "model": {
    "primary": "anthropic/claude-sonnet-4-5-20251022",
    "fallbacks": [
      "moonshot/moonshot-v1-128k",
      "friend/claude-sonnet-4-5-20251022"
    ]
  }
}
```

**预期收益**：
- ✅ 成本降低：代码任务用低成本模型（节省 50-80%）
- ✅ 响应速度：日常对话用快速模型（节省 30-50% 时间）
- ✅ 质量：复杂任务用高成本模型（提升输出质量）

#### 技巧 2：Sub-agent 模式提升效率

**来自社区最佳实践**：
- Coordinator Agent：长生命周期，负责用户交互和任务分配
- Worker Agents：短生命周期，spawn per task，完成即退出
- Crons/Hooks：完全隔离的 sessions，执行完成后清理

**架构示例**：
```
┌─────────────────────────────┐
│  Coordinator（主人）         │
│  ┌──┬──┬──┐        │
│  │  │  │  │        │
├──┴──┴──┴──┴──┤        │
│  Tasks  Tasks  Tasks       │
└─────────────────────────────┘
```

**实施方法**：
- Coordinator Agent：主 Gateway，接收用户指令
- Sub-agents：通过 `sessions_spawn` 创建
- Worker 类型：
  - `mode=run`：一次性任务（如代码审查）
  - `mode=session`：持续会话（如长期跟踪）
- 避免长生命周期 sessions：避免 context 冲突和 memory 污染

**配置示例**：
```bash
# Coordinator 配置
{
  "agents": {
    "defaults": {
      "session": {
        "maxDuration": "7d"  # Coordinator 会话保持 7 天
      }
    }
  }
}

# Worker 配置
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "model": {
          "primary": "kimi/kimi-for-coding",  # 低成本
          "fallbacks": ["moonshot/moonshot-v1-128k"]
        },
        "session": {
          "maxDuration": "1h"  # Worker 任务 1 小时
        }
      }
    ]
  }
}
```

#### 技巧 3：Memory 优化提升检索效率

**来自官方文档**：
- MEMORY.md：长期记忆（决策、偏好、关键事实）
- memory/YYYY-MM-DD.md：每日笔记（临时信息、工作日志）
- 避免在 MEMORY.md 中混入临时信息
- 定期归档 old daily files（保持 memory 轻量）

**Memory 搜索优化**：
- `memory_search` 只搜索 MEMORY.md（不搜索 daily files）
- 如果需要历史信息，手动读取相关 daily files
- 减少 memory 搜索的 token 消耗

**实施方法**：
```bash
# 每周维护
- 识别重要信息（决策、偏好、项目背景）
- 从 daily files 提取并整理到 MEMORY.md
- 删除超过 30 天的 daily files
- 保留 research/、config/、project-docs/ 等分类目录

# Memory 目录结构
memory/
├── MEMORY.md                    # 长期记忆
├── 2026-02-23.md                # 今日笔记
├── 2026-02-22.md                # 昨日笔记
├── research/                      # 研究文档
├── config/                        # 配置笔记
└── project-docs/                 # 项目文档
```

#### 技巧 4：自动化工作流设计

**来自社区实践**：
- 避免重复劳动：识别高频任务，自动化
- 使用 n8n 编排工作流：多个 OpenClaw 之间的协作
- 使用 cron jobs 定时执行：监控、数据汇总、报告
- 使用 bindings 智能路由：不同任务到不同 Agent

**示例：外链监控自动化流程**
```
┌────────────────────────────────┐
│  OpenClaw Gateway           │
│  ┌──┬──┬──┬──┐        │
│  │  │  │  │  │        │
├──┴──┴──┴──┴──┤        │
│  Semrush  →  飞书         │
│  X.com AI tab  →  飞书      │
│  Cron Job →  每日汇总     │
└────────────────────────────────┘
```

### 2. 隐藏功能和高级技巧

#### 技巧 5：Verbose Mode（调试和观察）

**功能**：`openclaw --verbose`
- 显示详细日志
- 查看模型选择和 fallback 过程
- 调试配置问题
- 观察 API 调用细节

**使用场景**：
- 配置新 Agent 时观察行为
- 测试 fallback 机制时切换过程
- 调试 bindings 路由问题

**示例**：
```bash
# 启用 verbose 模式
openclaw --verbose

# 在 verbose 模式下运行任务
openclaw agent turn "测试任务"

# 观察日志中的详细输出
# - 模型选择：选择了哪个模型？为什么选择它？
# - Fallback 切换：是否触发了 fallback？切换到哪个模型？
# - Bindings 路由：消息路由到哪个 Agent？
```

#### 技巧 6：Hooks 自动化（事件驱动）

**Hooks 类型**：
- `onChatStart`: 每次聊天开始时执行
- `onChatEnd`: 每次聊天结束时执行
- `onAgentTurn`: 每次 agent turn 执行后调用
- `onToolCall`: 每次工具调用前/后触发

**应用示例**：
```bash
# 创建 onChatEnd hook
cat > ~/.openclaw/hooks/chat-end.sh << 'EOF'
#!/bin/bash
# 每次聊天结束后，自动总结到 memory/YYYY-MM-DD.md
# 避免 API 消耗
echo "## [$(date '+%Y-%m-%d %H:%M')] 聊天总结" >> ~/.openclaw/workspace/memory/2026-02-23.md
echo "" >> ~/.openclaw/workspace/memory/2026-02-23.md
echo "### 关键信息" >> ~/.openclaw/workspace/memory/2026-02-23.md
echo "- 用户: $(cat ~/.openclaw/workspace/USER.md | grep '称呼' | awk '{print $3}')" >> ~/.openclaw/workspace/memory/2026-02-23.md
echo "- 时区: $(cat ~/.openclaw/workspace/USER.md | grep '时区' | awk '{print $3}')" >> ~/.openclaw/workspace/memory/2026-02-23.md
EOF

# 创建 HOOK.md
cat > ~/.openclaw/hooks/HOOK.md << 'EOF'
# Chat End Hook
#
# 在每次聊天结束时自动总结到 daily notes
#
# 触发条件: onChatEnd
#
# 文件: hooks/chat-end.sh
EOF

chmod +x ~/.openclaw/hooks/chat-end.sh
chmod +x ~/.openclaw/hooks/HOOK.md
```

#### 技巧 7：Session 状态管理

**发现的问题**：
- Session 污染：长期运行 sessions 会导致 context 冲突
- Memory 膨胀：所有信息混在一起
- 难以追踪：无法区分"当前状态"和"历史记录"

**最佳实践**：
- **Coordinator**: 长生命周期（7-30 天），保持上下文
- **Workers**: 短生命周期（1 小时或单次任务），避免污染
- **Crons**: 完全隔离，自动清理
- **每日总结**: 使用 hooks 自动将重要信息提取到 MEMORY.md

**配置示例**：
```json
// openclaw.json
{
  "agents": {
    "defaults": {
      "session": {
        // Coordinator（长生命周期）
        "maxDuration": "7d",
        // Workers（短生命周期）
        "workerMaxDuration": "1h"
      }
    },
    "list": [
      {
        "id": "coordinator",
        "name": "主人的助手",
        "session": {
          "maxDuration": "30d"  // 主会话保持 30 天
        }
      },
      {
        "id": "code-reviewer",
        "name": "代码审查员",
        "session": {
          "maxDuration": "1h"  // 任务后清理
        }
      },
      {
        "id": "data-analyst",
        "name": "数据分析员",
        "session": {
          "maxDuration": "30m"  // 数据任务后清理
        }
      }
    ]
  }
}
```

### 3. 安全和权限管理最佳实践

#### 技巧 8：Shell 权限优化

**问题来源**：
> "管理 shell 权限 24/7 是一个巨大的成本。OpenClaw 的安全性依赖于你如何管理这些权限。"

**最佳实践**：
- 使用 `sudoers` 文件管理持久化的 sudo 权限
- 避免频繁使用 `sudo`（尽量用 `sudo -v` 一次性批量）
- 使用 `launchd`/`launchctl` 管理服务，避免 `sudo`
- 使用 `chmod` 和 `chown` 设置文件权限

**示例**：
```bash
# 创建 sudoers 文件
cat > /etc/sudoers.d/openclaw << 'EOF'
# OpenClaw 相关命令
shengdongyang ALL=(/opt/homebrew/bin/node) NOPASSWD: SETENV:OPENCLAW_STATE_DIR=/Users/shengdongyang/.openclaw
shengdongyang ALL=(/opt/homebrew/bin/node) NOPASSWD: SETENV:OPENCLAW_CONFIG_PATH=/Users/shengdongyang/.openclaw/openclaw.json
EOF

# 不需要 sudo 的情况下，使用环境变量
export OPENCLAW_STATE_DIR=/Users/shengdongyang/.openclaw
export OPENCLAW_CONFIG_PATH=/Users/shengdongyang/.openclaw/openclaw.json

# 管理服务（非 root）
launchctl list | grep openclaw
launchctl unload ai.openclaw.gateway
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

#### 技巧 9：API Key 安全管理

**最佳实践**：
- 不在脚本中硬编码 API Keys
- 使用环境变量或配置文件（~/.openclaw/credentials/）
- 定期轮换 API Keys（每月）
- 监控 API 使用量和成本
- 使用多 provider 分散风险

**配置示例**：
```bash
# 环境变量方式
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENROUTER_API_KEY="sk-or-..."

# 配置文件方式
cat > ~/.openclaw/credentials/api-keys.conf << 'EOF'
# API Keys 配置
# 注意：这个文件不应该提交到 Git
ANTHROPIC_API_KEY="sk-ant-..."
OPENROUTER_API_KEY="sk-or-..."
MOONSHOT_API_KEY="sk-..."
EOF

chmod 600 ~/.openclaw/credentials/api-keys.conf
```

### 4. 性能和可观测性

#### 技巧 10：成本追踪和控制

**最佳实践**：
- 为不同 Agent 设置不同的成本上限
- 使用 `agents.defaults.model.costControl`（如果支持）
- 定期检查 API 使用量和成本
- 根据任务类型动态调整模型

**配置示例**：
```json
{
  "agents": {
    "defaults": {
      "model": {
        "costControl": {
          "dailyBudget": 10.00,
          "alertThreshold": 8.00,
          "alertAction": "downgrade"
        }
      }
    },
    "list": [
      {
        "id": "home",
        "model": {
          "costControl": {
            "dailyBudget": 2.00,
            "alertThreshold": 1.50,
            "alertAction": "notify"
          }
        }
      },
      {
        "id": "work",
        "model": {
          "costControl": {
            "dailyBudget": 5.00,
            "alertThreshold": 4.00,
            "alertAction": "downgrade"
          }
        }
      },
      {
        "id": "coding",
        "model": {
          "costControl": {
            "dailyBudget": 8.00,
            "alertThreshold": 6.00,
            "alertAction": "downgrade"
          }
        }
      }
    ]
  }
}
```

#### 技巧 11：Dashboard 部署（推荐）

**社区最佳项目**：
- `tugcantopaloglu/openclaw-dashboard`: 功能最全，零依赖
- `adamevers/openclaw-dashboard`: 简洁实用
- `mudrii/openclaw-dashboard`: 零依赖命令中心

**快速部署**：
```bash
# 方案 1：tugcantopaloglu/openclaw-dashboard（推荐）
cd ~/.openclaw
git clone https://github.com/tugcantopaloglu/openclaw-dashboard.git
cd openclaw-dashboard
npm install
npm start

# 方案 2：adamevers/openclaw-dashboard（轻量级）
git clone https://github.com/adamevers/openclaw-dashboard.git
cd openclaw-dashboard
npm install
node server.js

# 访问 Dashboard
# 打开浏览器访问 http://localhost:3000（默认端口）
```

### 5. 工作流自动化模式

#### 模式 1：Morning Routine（晨间例程）

**场景**：自动化的早晨任务
- 晨间简报：汇总昨天的工作和今日计划
- 任务优先级：从不同来源收集任务（飞书、邮件、Telegram）
- 天气和新闻：自动获取天气和新闻摘要
- 提醒：检查重要事项和截止日期

**实现方式**：
```bash
# 创建晨间例程 cron job
openclaw cron add \
  --cron "0 7 * * 1-5" \
  --label "晨间简报" \
  --message "生成今日工作简报：1. 昨日工作总结 2. 今日任务优先级 3. 天气和新闻"
```

#### 模式 2：Research Pipeline（研究管道）

**场景**：自动化研究流程
- 信息收集：从多个来源自动收集信息
- 分析和整理：提取关键信息
- 记录和归档：保存到 research/ 目录
- 通知和汇报：生成研究报告

**实现方式**：
```bash
# Coordinator 负责协调
# Workers 负责具体研究任务
# 通过 bindings 路由到不同 Workers

# 示例：外链监控研究管道
# Worker 1: 收集 Semrush 数据
# Worker 2: 收集 X.com AI tab 数据
# Worker 3: 分析竞品外链
# Coordinator: 整理所有数据，生成报告
```

---

## 🎯 建议的下一步

### 短期（本周）

1. **完成 Agent 重建**
   - 使用 TUI 创建 work 和 coding Agent
   - 配置 Bindings
   - 测试验证

2. **应用高级技巧**
   - 为每个 Agent 配置不同的成本预算
   - 实施智能模型分配
   - 设置 session 管理策略

3. **部署监控 Dashboard**
   - 选择合适的 Dashboard 项目
   - 配置访问控制
   - 验证监控功能

### 中期（本月）

1. **完善自动化工作流**
   - 创建晨间例程 cron job
   - 设计研究管道（coordinator + workers）
   - 实施事件驱动 hooks

2. **Memory 优化**
   - 定期归档 old daily files
   - 清理重复和过期信息
   - 优化 search 效率

3. **成本优化**
   - 实施 API Key 轮换机制
   - 监控成本和使用量
   - 根据使用量调整策略

---

## 📊 技能和最佳实践总结

### 效率提升技巧

| 技巧 | 描述 | 预计收益 | 实施难度 |
|------|------|----------|----------|
| 智能模型分配 | 不同 Agent 用不同模型 | 成本降低 50% | 低 |
| Sub-agent 模式 | Coordinator + Workers | 响应速度提升 30% | 中 |
| Memory 优化 | 分离长期和临时 | 搜索效率提升 50% | 低 |
| 自动化工作流 | 减少重复劳动 | 时间节省 80% | 中 |

### 高级功能和技巧

| 功能/技巧 | 描述 | 使用场景 |
|-----------|------|---------|
| Verbose Mode | 调试和观察 | 配置问题排查 |
| Hooks | 事件驱动自动化 | 聊天总结、自动归档 |
| Session 管理 | 控制生命周期 | 避免污染、提升性能 |
| Shell 权限优化 | 管理持久化权限 | 安全和效率 |
| API Key 安全 | 不硬编码、轮换机制 | 安全和可靠性 |
| 成本追踪和控制 | 预算监控、动态调整 | 成本优化 |
| Dashboard 部署 | 实时监控、成本追踪 | 可观测性 |

### 工作流模式

| 模式 | 描述 | 适用场景 |
|------|------|---------|
| Morning Routine | 晨间例程、简报、提醒 | 每日任务 |
| Research Pipeline | 信息收集 → 分析 → 归档 | 研究任务 |
| Cron Automation | 定时执行、监控、报告 | 重复性任务 |
| Event-Driven | Hooks 驱动的自动化 | 聊天总结、自动归档 |

---

## 📝 关键认知升级

### 之前的问题

1. ❌ **从零开始**：不研究官方文档和社区实践
2. ❌ **重复造轮子**：手动实现已有功能
3. ❌ **配置混乱**：文件职责不清，信息散落
4. ❌ **效率低下**：手动切换、人工检查、重复劳动

### 现在的改进

1. ✅ **先研究再动手**：查阅官方文档、社区最佳实践
2. ✅ **利用原生功能**：API failover、bindings、memory
3. ✅ **清晰的结构**：文件职责明确，易于维护
4. ✅ **智能自动化**：sub-agent 模式、hooks、cron
5. ✅ **成本优化**：模型分配、预算控制、成本追踪

### 核心原则

> 先研究再动手、利用原生功能、清晰的结构、智能自动化、成本优化

---

## 📚 参考资料

- OpenClaw 官方文档：docs.openclaw.ai
- 技能视频：YouTube - "OpenClaw Tips No One Tells You"
- 高级自动化：21 OpenClaw Automations in 30 Minutes
- Awesome Skills：github.com/VoltAgent/awesome-openclaw-skills
- 社区讨论：reddit.com/r/AI_Agents, reddit.com/r/vibecoding
- 成功案例：github.com/openclaw/openclaw/showcase

---

**学习完成时间**: 2026-02-23 20:20
**下一步**: 等你确认后开始应用这些技巧
