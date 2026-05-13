# Agent 架构设计 - 2026-02-23

**设计时间**: 2026-02-23 22:15
**目标**: 根据主人的业务需求，设计 4 个专业 Agent

---

## 📊 业务分析

### 1. 外链监控与提交
**核心职责**：
- 自动监控 Semrush API（外链监控）
- 自动提交到飞书 Bitable（数据汇总）
- 数据汇总和报告生成

**技术栈**：
- Semrush API
- 飞书 Bitable API
- Playwright（浏览器自动化）
- Python + Shell 脚本自动化

**数据流**：
```
Semrush API → 飞书 Bitable
          ↓
    数据处理和汇总
          ↓
    飞书 Bitable（飞书表格）
```

---

### 2. 内容专家

**核心职责**：
- 外链内容研究和整理
- 外链数据分析和归档
- 项目文档整理和维护

**技术栈**：
- 社媒平台 API（如果需要）
- 研究文档
- 文档系统（Obsidian/Notion）
- 数据分析工具

**数据流**：
```
社媒平台 → 外链内容采集
          ↓
    内容研究和整理
          ↓
    项目文档归档
```

---

### 3. 社媒专家

**核心职责**：
- 社媒动态监控
- 关键词监控（每日 cron job）
- 品牌提及监控
- 竞品社媒动态监控

**技术栈**：
- 社媒平台 API（X.com、LinkedIn）
- Cron job（定时执行）
- Markdown（文档）

**数据流**：
```
社媒平台 → 关键词/动态
          ↓
    监控结果汇总
          ↓
    数据汇总到飞书 Bitable
```

---

### 4. 代码审查专家

**核心职责**：
- 代码审查（手动触发）
- 技术问题排查
- 系统优化建议
- 最佳实践学习

**技术栈**：
- OpenClaw（AI 助手）
- Git + GitHub
- 代码分析工具

**数据流**：
```
主人手动触发代码审查
          ↓
    代码分析
          ↓
    优化建议
          ↓
    记录问题和方案
```

---

## 🏗️ Agent 定义

### 1. Backlink Agent（外链专家）

```json
{
  "id": "backlink",
  "name": "Backlink",
  "emoji": "🔗",
  "workspace": "~/.openclaw/workspace-backlink",
  "model": {
    "primary": "anthropic/claude-sonnet-4-5-20251022",
    "fallbacks": [
      "moonshot/moonshot-v1-128k",
      "friend/claude-sonnet-4-5-20251022",
      "kimi/kimi-for-coding"
    ]
  }
}
```

**核心能力**：
- 外链数据采集（Semrush API + X.com AI tab）
- 外链数据汇总和报告
- 外链数据分析和归档

**配置 Bindings**：
- Telegram: default bot（与 home Agent 共用）
- 路由：default bot → backlink

---

### 2. Content Agent（内容专家）

```json
{
  "id": "content",
  "name": "Content",
  "emoji": "📝",
  "workspace": "~/.openclaw/workspace-content",
  "model": {
    "primary": "anthropic/claude-sonnet-4-5-20251022",
    "fallbacks": [
      "moonshot/moonshot-v1-128k",
      "zhipu-anthropic/claude-sonnet-4-5-20251022"
      "codesome/claude-sonnet-4-5-20251022"
    ]
  }
}
```

**核心能力**：
- 外链内容研究和整理
- 项目文档归档和维护
- Markdown 文档系统
- 数据分析工具

**配置 Bindings**：
- Telegram: default bot（与 home Agent 共用）
- 路由：default bot → content

---

### 3. Social Agent（社媒专家）

```json
{
  "id": "social",
  "name": "Social",
  "emoji": "💬",
  "workspace": "~/.openclaw/workspace-social",
  "model": {
    "primary": "anthropic/claude-sonnet-4-5-20251022",
    "fallbacks": [
      "moonshot/moonshot-v1-128k",
      "zhipu-anthropic/claude-sonnet-4-5-20251022"
      "codesome/claude-sonnet-4-5-20251022"
      "friend/claude-sonnet-4-5-20251022"
    ]
  }
}
```

**核心能力**：
- 社媒动态监控（X.com、LinkedIn、Facebook）
- 关键词监控（每日 cron job）
- 品牌提及监控
- 竞品社媒动态监控
- 监控结果汇总到飞书

**配置 Bindings**：
- Telegram: research bot（与 work Agent 共用）
- 路由：research bot → social

---

### 4. Coding Agent（代码审查专家）

```json
{
  "id": "coding",
  "name": "Coding",
  "emoji": "💻",
  "workspace": "~/.openclaw/workspace-coding",
  "model": {
    "primary": "kimi/kimi-for-coding",
    "fallbacks": [
      "openrouter/anthropic/claude-sonnet-4-5-20251022",
      "moonshot/moonshot-v1-128k",
      "zhipu-anthropic/claude-sonnet-4-5-20251022",
      "codesome/claude-sonnet-4-5-20251022"
    ]
  }
}
```

**核心能力**：
- 代码审查（手动触发）
- 技术问题排查
- 系统优化建议
- 最佳实践学习

**配置 Bindings**：
- Telegram: coding-bot（专用）
- 路由：coding-bot → coding

---

## 🔗 Workspace 设计

### 目录结构

```
~/.openclaw/
├── workspace-backlink/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── TOOLS.md
│   ├── TOOLS.md
│   └── workspace/
├── workspace-content/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── TOOLS.md
│   ├── workspace/
├── workspace-social/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── TOOLS.md
│   ├── workspace/
├── workspace-coding/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── TOOLS.md
│   ├── workspace/
```

### Agent 对应关系

```
Bot 账户     Agent         Bindings         用途
──────────────────────────────────────────┬────────────────────┤──────────────────────┐
default bot  → backlink     外链监控
default bot  → content      内容专家
default bot  → social        社媒监控
coding-bot → coding     代码审查
research bot → work        工作助手
```

---

## 📋 Bindings 配置

```json
"bindings": [
  {
    "agentId": "backlink",
    "match": {
      "channel": "telegram",
      "accountId": "default"
    }
  },
  {
    "agentId": "content",
    "match": {
      "channel": "telegram",
      "accountId": "default"
    }
  },
  {
    "agentId": "social",
    "match": {
      "channel": "telegram",
      "accountId": "research"
    }
  },
  {
    "agentId": "coding",
    "match": {
      "channel": "telegram",
      "accountId": "coding-bot"
    }
  },
  {
    "agentId": "work",
    "match": {
      "channel": "telegram",
      "accountId": "research"
    }
  }
]
```

---

## 🎯 核心原则

### 1. 专业化分工
- 每个 Agent 有明确的业务领域
- 每个 Agent 只负责自己的领域
- 通过 Bindings 路由到不同的 Bot

### 2. 集中式通信
- default bot → backlink、content、social（3 个 Agent 共用）
- research bot → work、social
- coding-bot → coding（专用）

### 3. 独立 workspace
- 每个 Agent 有独立的 workspace
- SOUL.md + USER.md + TOOLS.md
- workspace/（临时文件和草稿）

### 4. 可扩展性
- 需要新 Agent？ → 创建新的 Agent
- 需要新 Bot？ → 添加 bindings
- 修改 Bindings？ → 更新路由规则

---

## 📊 预期效果

### 资源优化
- 内存占用：4 个 Agent（backlink、content、social、coding）
- 每个 Agent 独立 workspace
  跨大的性能提升 vs 4 个 Gateway

### 效率提升
- 专业化分工 → 每个 Agent 只专注自己的领域
- Bindings 路由 → 精确分配任务

### 故障隔离
- 一个 Agent 故障 → 其他 3 个不受影响
- main Agent 故障 → 只影响主会话

---

## 📋 下一步

### 等你确认后：

1. ✅ 删除错误的 Agent 定义（work、coding、home）
2. ✅ 使用 TUI 重建这 4 个 Agent
3. ✅ 配置 Bindings（default、research、coding-bot）
4. ✅ 测试验证所有 Agent 独立响应
5. ✅ 测试 Bindings 路由

---

**预计时间**：10-20 分钟

---

**文档状态**：
- ✅ Agent 架构设计完成
- ✅ 4 个 Agent 明确分工
- ✅ Bindings 路由清晰
- ✅ Workspace 结构完整

**创建时间**: 2026-02-23 22:15
