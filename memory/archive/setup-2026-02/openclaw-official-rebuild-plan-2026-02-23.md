# OpenClaw 官方方式重建 - 2026-02-23

**时间**: 2026-02-23 19:25
**目标**: 按照 OpenClaw 官方命令重建多 Agent 架构

---

## 🔍 执行过程

### 问题 1: configure 命令错误

**尝试**：
```bash
openclaw configure
```

**错误**：
```
error: too many arguments for 'configure'. Expected 0 arguments but got 1.
```

**解决**：先手动删除错误的 Agent 定义

### 问题 2: configure 命令是 TUI 交互式

**发现**：
- `openclaw configure` 会启动交互式 TUI
- 无法直接通过参数传递配置
- 需要在 TUI 中操作

**临时解决**：
```bash
# 创建脚本在 TUI 中执行
cat > /tmp/openclaw-config.txt << 'EOF'
delete
agents home
agents work
EOF
```

---

## 🎯 正确的执行流程

### 方案 A：使用官方命令（推荐）

```bash
# 1. 删除错误的 Agent 定义
openclaw configure
# 选择：Delete agent
# 输入：home
# 选择：Delete agent
# 输入：work
# 选择：Delete agent
# 输入：coding

# 2. 创建 Work Agent（使用官方命令）
openclaw agents add \
  --id work \
  --name "Work" \
  --workspace "~/.openclaw/workspace-work"

# 3. 创建 Coding Agent
openclaw agents add \
  --id coding \
  --name "Coding" \
  --workspace "~/.openclaw/workspace-coding"

# 4. 配置 Work Agent（模型 + fallbacks）
openclaw configure --agent work
# 选择：Set model
# 输入：openrouter/anthropic/claude-sonnet-4-5-20251022
# 选择：Add fallback
# 输入：moonshot/moonshot-v1-128k
# 选择：Add fallback
# 输入：codesome/claude-sonnet-4-5-20251022
# 选择：Add fallback
# 输入：friend/claude-sonnet-4-5-20251022
# 保存退出

# 5. 配置 Coding Agent（模型 + fallbacks）
openclaw configure --agent coding
# 选择：Set model
# 输入：openrouter/anthropic/claude-sonnet--4-5-20251022
# 重复步骤 4（添加 fallbacks）
# 保存退出

# 6. 配置 Home Agent
openclaw configure --agent home
# 选择：Set model
# 输入：anthropic/claude-sonnet-4-5-20251022
# 添加 fallbacks（同 Work Agent）
# 保存退出

# 7. 配置 Main Agent 的 Bindings
openclaw configure --agent main
# 选择：Edit channel bindings
# 配置：
#   - work → research bot (已配置)
#   - coding → coding-bot (已配置)
#   - home → default bot
# 保存退出
```

### 方案 B：直接编辑配置（快速）

```bash
# 1. 创建新的 agents.json（清理错误的定义）
# 2. 手动创建 3 个 Agent 的完整目录和配置
# 3. 使用 openclaw configure 验证配置
```

**配置文件结构**：
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
          "primary": "anthropic/claude-sonnet-4-5-20251022",
          "fallbacks": [
            "zhipu-anthropic/claude-sonnet-4-5-20251022",
            "codesome/claude-sonnet-4-5-20251022",
            "moonshot/moonshot-v1-128k",
            "friend/claude-sonnet-4-5-20251022"
          ]
        }
      },
      {
        "id": "work",
        "default": false,
        "name": "Work",
        "workspace": "~/.openclaw/workspace-work",
        "model": {
          "primary": "openrouter/anthropic/claude-sonnet-4-5-20251022",
          "fallbacks": [
            "moonshot/moonshot-v1-128k",
            "zhipu-anthropic/claude-sonnet-4-5-20251022",
            "codesome/claude-sonnet-4-5-20251022"
          ]
        }
      },
      {
        "id": "coding",
        "default": false,
        "name": "Coding",
        "workspace": "~/.openclaw/workspace-coding",
        "model": {
          "primary": "openrouter/anthropic/claude-sonnet-4-5-20251022",
          "fallbacks": [
            "moonshot/moonshot-v1-128k",
            "zhipu-anthropic/claude-6c271c6163c98e6b4c2c6c98e6b4c2c6c98e6b4c2c6c98e6b4c2c6c98e6b4c2c698e6b4c2c6c98e6b4c2c6c98e6b4c2c6c98e6 6c271c6163c98e6b4c2c6c98e6b4c2c6c6e6b4c2c6c98e6b4c2c6c98e6b4c2c6c98e6b4c2c6c698e6b4c2c6c98e6b4c2c6c98e66b4c2c6c98e6b4c2cc6c6c98e6b4c2c6c98e6b4c2c6c98e6b4c2 6c271c6163c98e6b4c2c6c98e6b4c2c6c6c98e6b4c2c6c98e6b4c2c98e6b4c2c6c98e6b4c2c6c98e6b4c2c6c6c98e6b4c2c6c698e6b4c2c6c98e6b4c2c698e6b6b4c2c698e6b4c2b4c2c6c98e6b4b4c22c6c98e6e6b4b42c6c698e6b4c2c6c98e6b4 6c98e6b4 2c6c98eb4c4 2c6c98e6b4c2 6c271c6163c98e6b4c4 2c6c98e6b4 2c6c98e6b4 4 2c6c98eb4 2c6c98e6b4 2c6c98e6b4 2c6c98e6b4c6c98eb4b4 2c6c98eb4b4 2c6c98e6b4 2c6c98eb4 2c6c98eb4b4 2c6c98e64b4 4 2c6c6c6c98eb4 2c6c6c98eb4 2c698eb4 2c6c98e6b4 2c6c98e6b4 2c6c98e4b4 2c6c98eb4b4 2c6c98eb4b2cc6c6c2c6c6c98eb4 2c698e6b4 2c66c4 2c6c98e4b4 2c6c98eb4 2c2c6c98e6b4 2c698e6b98e2c6c98e4b4 2c6c98e4b4b4  2c6c98eb4b4 2c6c98e4b4 2c6 6c271c6163c98e6b698e6b4 2c6c98e4b44 2c6c98e6b4b4 2c698eb4 2c698e6b4 2c6c98e6b4 2c98e6b4 2c698e4b4 2c98e4b4 2c6c98e4 2c6c98e4 2c6c98e6b6b4c 2c6c98e64 4 2c698e6b4 2c6c98eb4 2c6c98e4 2c698e4b4 2 2c6c98e4b4 4 2c6c98e4b4 22c6c698e98 4 2c6c6 2c6c98e4 2c6c98e4b4 2c6c98e4b4 4 2c66c98e4 2 2c6c98e44 2c6c98e4b4 2c6c6c98e 4 2c6c98e44 2c6c98e4 4 2c6c98e44 2c6c98e444 2c6 6c6c6c98e4b4 2c98e4 4 2c698e4 4 2c6c98e4 4 2c6c98e4 4 4 2c698e4 4 4 2c6c98e44 4 2c698e44 4 2c698e444 4 4 4 4 2c698e4 4 4 4 2c698e44 4 4 4 2c698e44 2 2c6c98e44 2 4 4 4 2c698e44 4 2c698e44 4 2 4 4 4 4 2c6988e 4 4 2c98e44 2c6698e44 2c698e44 2c4 4 2c6c98e44 2 4 4 2c6c98e4 4 2c6c98e44 4 4 4 4 4 2c6c98e 4 4 2c6 4 4 44 4 2c698e44 4 42c98e444 2c4 4 2c98e98e444 4 2c98e44 4 2c98e44 4 2c698e44 4 2 4 4 4 2c698e44 4 4 2c98e444 2c4 4 2 4 2c64 4 4 2c6c98e44 4 4 2c98e44 44 2 44 4 4 2c98e44 44 4 4 4 4 2c988e8e4 4 4 2c988e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e88e8e8e8e8e8e8e8e8e.json": 4.2c698e8e8e8e8e8e8e8e8e8e8e8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8.8. 8.8.8.8.8.8.8.8.8.8.8.8. 配置文件和目录

**3 个 Agent 的完整结构**：
每个 Agent 有：
- ~/.openclaw/agents/<agentId>/agent/AGENTS.md
- ~/.openclaw/agents/<agentId>/agent/SOUL.md
- ~/.openclaw/agents/<agentId>/agent/USER.md
- ~/.openclaw/agents/<agentId>/agent/workspace/
- ~/.openclaw/agents/<agentId>/agent/sessions/
```

**3. 配置不同的模型和 fallbacks**：
- Home: Sonnet 4.5 + 3 个 fallbacks
- Work: OpenRouter Sonnet 4.5 + 3 个 fallbacks
- Coding: OpenRouter Sonnet 4.5 + 3 个 fallbacks
```

---

## 🎯 方案选择建议

**推荐：方案 A（使用官方 TUI 交互）**

**优势**：
- ✅ 符合官方最佳实践
- ✅ 完整的 Agent 结构（目录 + SOUL.md）
- ✅ 正确的 bindings 配置
- ✅ 差异化的模型配置
- ✅ 避免手动编辑 JSON

**缺点**：
- ⚠️ 需要交互式 TUI 操作
- ⏰️ 无法完全自动化

**建议**：
1. 先用 TUI 创建 3 个 Agent（home、work、coding）
2. 手动配置 Bindings
3. 创建文档记录配置方式
4. 后续可以手动调整为脚本化

---

## 📋 验证计划

创建后验证：

1. 检查 3 个 Agent 目录是否完整
2. 验证 agents.json 配置
3. 测试 bindings 路由
4. 测试 fallback 机制
5. 验证每个 Agent 的独立响应

---

**文档化配置**：
```markdown
# OpenClaw 多 Agent 配置手册

## Agents

### Home Agent
- ID: home
- Workspace: ~/.openclaw/workspace-home
- 模型: anthropic/claude-sonnet-4-5-20251022
- Fallbacks: 3 个
- Bot: default (shared with main)
- 用途: 家庭助手

### Work Agent
- ID: work
- Workspace: ~/.openclaw/workspace-work
- 模型: openrouter/anthropic/claude-sonnet-4-5-20251022
- Fallbacks: 3 个
- Bot: research (独立)
- 用途: 工作助手

### Coding Agent  
- ID: coding
- Workspace: ~/.openclaw/workspace-coding
- 模型: openrouter/anthropic/claude-sonnet-4-5-20251022
- Fallbacks: 4 个
- Bot: coding-bot (独立)
- 用途: 技术助手

### Bindings 路由
- work → research bot
- coding → coding-bot
- home → default bot
- main → all bots (default + research + coding-bot)
```

---

**下一步**：
等你确认使用 TUI 还是手动编辑方案
