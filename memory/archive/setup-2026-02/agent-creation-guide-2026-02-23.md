# Agent 配置问题与解决方案 - 2026-02-23

**创建时间**: 2026-02-23 22:40
**目标**: 记录 Agent 配置问题，为未来创建更多 Agent 提供参考

---

## 🚨 常见问题：dmPolicy: "pairing"

### 问题描述
**Bot 返回错误**：
```
You are not authorized to use this command.
```

**原因**：
- dmPolicy 配置为 "pairing"（需要配对）
- 用户尚未"配对" Bot 到自己的账户
- Bot 拒绝未配对用户的请求

---

## ✅ 解决方案

### 方法 1：修改 dmPolicy 为 "open"

**步骤**：
1. 编辑 `~/.openclaw/openclaw.json`
2. 找到对应的 Bot 配置（例如 "coding"）
3. 将 `"dmPolicy": "pairing"` 改为 `"dmPolicy": "open"`
4. 重启 Gateway：`openclaw gateway restart`

**示例**：
```json
"coding": {
  "dmPolicy": "open",  // 改为 open
  "botToken": "8300082824:AAEu9cGy-d6cVjAjGHxkEcEbH0Y94EloUJs",
  "groupPolicy": "allowlist",
  "streaming": "off"
}
```

---

## 📋 创建新 Agent 的最佳实践

### 步骤 1：创建 Workspace

**命令**：
```bash
mkdir -p ~/.openclaw/workspace-<agent-name>/
```

### 步骤 2：复制配置文件

**命令**：
```bash
cp ~/.openclaw/workspace/SOUL.md ~/.openclaw/workspace-<agent-name>/
cp ~/.openclaw/workspace/AGENTS.md ~/.openclaw/workspace-<agent-name>/
cp ~/.openclaw/workspace/USER.md ~/.openclaw/workspace-<agent-name>/
```

### 步骤 3：创建 Agent

**命令**：
```bash
openclaw agents add <agent-id> --workspace ~/.openclaw/workspace-<agent-name> --model <model-id> --non-interactive
```

### 步骤 4：配置 Bindings

**编辑 `~/.openclaw/openclaw.json`**：
```json
{
  "agentId": "<agent-id>",
  "match": {
    "channel": "telegram",
    "accountId": "<account-id>"
  }
}
```

### 步骤 5：配置 dmPolicy

**编辑 `~/.openclaw/openclaw.json`**：
```json
"<account-id>": {
  "dmPolicy": "open",  // 重要：设置为 "open"
  "botToken": "<bot-token>",
  "groupPolicy": "allowlist",
  "streaming": "off"
}
```

### 步骤 6：重启 Gateway

**命令**：
```bash
openclaw gateway restart
```

---

## 🎯 待创建的 Agent 清单

根据主人的需求，需要创建以下 Agent：

### 1. **需求调研** (Research)
**职责**：
- 关键词调研
- 用户调研
- 竞对调研

**模型**：anthropic/claude-sonnet-4-5-20251022
**Bot**：需要新建

---

### 2. **产品经理** (Product Manager)
**职责**：
- 产品规划
- 功能设计
- 需求管理

**模型**：anthropic/claude-sonnet-4-5-20251022
**Bot**：需要新建

---

### 3. **增长黑客** (Growth Hacking)
**职责**：
- 增长策略
- 数据分析
- 营销优化

**模型**：anthropic/claude-sonnet-4-5-20251022
**Bot**：需要新建

---

### 4. **运营** (Operations)
**职责**：
- 日常运营
- 数据监控
- 流程优化

**模型**：moonshot/moonshot-v1-128k（低成本）
**Bot**：需要新建

---

### 5. **后勤** (Logistics)
**职责**：
- 资源管理
- 时间协调
- 任务分配

**模型**：moonshot/moonshot-v1-128k（低成本）
**Bot**：可以共用现有 Bot

---

### 6. **外链专员** (Backlink Specialist)
**职责**：
- 外链监控（Semrush API）
- 外链提交（飞书 Bitable）
- 数据汇总和报告

**模型**：moonshot/moonshot-v1-128k（低成本）
**Bot**：default bot（共用）

---

### 7. **社媒专家** (Social Media Expert)
**职责**：
- 社媒动态监控（X.com、LinkedIn）
- 品牌提及监控
- 竞品社媒动态
- 监控结果汇总到飞书

**模型**：anthropic/claude-sonnet-4-5-20251022
**Bot**：research bot（与 work 共用）

---

## 🔧 创建新 Agent 的自动化脚本

为了提高效率，可以创建一个自动化脚本：

**创建 `~/.openclaw/create-agent.sh`**：

```bash
#!/bin/bash

# Agent 创建脚本
# 用法：./create-agent.sh <agent-id> <workspace-path> <model-id> <account-id>

AGENT_ID=$1
WORKSPACE=$2
MODEL=$3
ACCOUNT_ID=$4

# 创建 workspace
mkdir -p $WORKSPACE

# 复制配置文件
cp ~/.openclaw/workspace/SOUL.md $WORKSPACE/
cp ~/.openclaw/workspace/AGENTS.md $WORKSPACE/
cp ~/.openclaw/workspace/USER.md $WORKSPACE/

# 创建 Agent
openclaw agents add $AGENT_ID --workspace $WORKSPACE --model $MODEL --non-interactive

echo "Agent $AGENT_ID created successfully!"
echo "Workspace: $WORKSPACE"
echo "Model: $MODEL"
echo "Please manually add bindings for account: $ACCOUNT_ID"
```

**使用方法**：
```bash
chmod +x ~/.openclaw/create-agent.sh
~/.openclaw/create-agent.sh research ~/.openclaw/workspace-research anthropic/claude-sonnet-4-5-20251022 research
```

---

## 📊 当前 Agent 架构

### 已创建的 Agent

| Agent ID | 名称 | Bot | 模型 | 职责 |
|----------|------|------|--------|--------|
| main | 主助手 | default bot | zhipu-anthropic/claude-sonnet-4-5-20251022 | 默认路由 |
| work | 工作助手 | research bot | anthropic/claude-sonnet-4-5-20251022 | 项目管理 |
| coding | 技术专家 | coding-bot | kimi/kimi-for-coding | 代码审查 |

### 待创建的 Agent

| Agent ID | 名称 | Bot | 模型 | 职责 |
|----------|------|------|--------|--------|
| research | 需求调研 | 待创建 | anthropic/claude-sonnet-4-5-20251022 | 调研 |
| product | 产品经理 | 待创建 | anthropic/claude-sonnet-4-5-20251022 | 产品 |
| growth | 增长黑客 | 待创建 | anthropic/claude-sonnet-4-5-20251022 | 增长 |
| operations | 运营 | 待创建 | moonshot/moonshot-v1-128k | 运营 |
| logistics | 后勤 | 共用 | moonshot/moonshot-v1-128k | 后勤 |
| backlink | 外链专员 | default bot | moonshot/moonshot-v1-128k | 外链 |
| social | 社媒专家 | research bot | anthropic/claude-sonnet-4-5-20251022 | 社媒 |

---

## 🎯 下一步

**优先级 1**：
- 创建自动化脚本 `create-agent.sh`
- 测试脚本是否正常工作

**优先级 2**：
- 创建 research Agent（需求调研）
- 创建 product Agent（产品经理）
- 创建 growth Agent（增长黑客）

**优先级 3**：
- 创建 operations Agent（运营）
- 创建 logistics Agent（后勤）
- 创建 backlink Agent（外链专员）
- 创建 social Agent（社媒专家）

---

**创建时间**: 2026-02-23 22:40
