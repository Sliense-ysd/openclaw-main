# OpenClaw 最佳实践学习笔记

基于社区项目 [awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases) 的学习总结。

## 项目概览

这是一个社区驱动的 OpenClaw 实际使用案例集合，目前包含 **29 个真实案例**，涵盖社交媒体、创意构建、基础设施、生产力、研究学习、金融交易等多个领域。

## 核心理念

> "解决 OpenClaw 适应性的瓶颈：不是技能，而是找到它能改善你生活的方式。"

所有案例都是经过验证的真实使用场景，而非理论构想。

---

## 重点案例分析

### 1. 多 Agent 专业团队（Multi-Agent Specialized Team）

**适用场景**：独立创业者需要同时处理战略、开发、营销、销售等多个角色

**核心痛点**：
- 单个 agent 无法胜任所有工作
- 缺乏专业化导致输出质量平庸
- 频繁切换上下文导致效率低下
- 知识孤岛问题

**解决方案**：
创建多个专业化的 agent，每个有独特的角色、个性和模型：

```text
Agent 1: Milo (战略负责人)
- 职责：战略规划、协调其他 agent、OKR 跟踪
- 模型：Claude Opus
- 每日任务：8:00 AM 晨会总结，6:00 PM 日终回顾

Agent 2: Josh (商业分析)
- 职责：定价策略、竞品分析、增长指标、收入建模
- 模型：Claude Sonnet（快速、分析型）
- 每日任务：9:00 AM 拉取关键指标

Agent 3: Marketing Agent (营销研究)
- 职责：内容创意、竞品监控、趋势追踪、SEO 研究
- 模型：Gemini（擅长网络研究和长上下文）
- 每日任务：10:00 AM 提供 3 个内容创意

Agent 4: Dev Agent (开发)
- 职责：编码、架构决策、代码审查、技术文档
- 模型：Claude Opus / Codex
- 每日任务：检查 CI/CD、审查 PR、标记技术债
```

**关键设计**：

1. **共享记忆结构**：
```text
team/
├── GOALS.md           # 当前 OKR 和优先级（所有 agent 可读）
├── DECISIONS.md       # 关键决策日志（仅追加）
├── PROJECT_STATUS.md  # 当前项目状态（所有人更新）
├── agents/
│   ├── milo/          # Milo 的私有上下文
│   ├── josh/          # Josh 的私有上下文
│   ├── marketing/     # 营销 agent 的研究
│   └── dev/           # 开发 agent 的技术笔记
```

2. **Telegram 路由**：
- 单个 Telegram 群组
- 通过 @mention 调用特定 agent
- @all 广播给所有 agent
- 无标签时默认由团队负责人处理

3. **定时任务**：
- 每日：晨会、指标拉取、内容创意、日终回顾
- 持续：CI/CD 监控、社交媒体监控
- 每周：周计划、周报

**核心洞察**：
- **个性很重要**：给 agent 不同的名字和沟通风格，让交互更自然
- **共享记忆 + 私有上下文**：既需要共同基础（目标、决策），也需要各自的专业知识积累空间
- **模型匹配任务**：不要用昂贵的推理模型做关键词监控
- **定时任务是飞轮**：主动浮现洞察，而非被动等待询问
- **从 2 个开始，而非 4 个**：先建立负责人 + 1 个专家，再根据瓶颈添加

**灵感来源**：
- [@iamtrebuh](https://x.com/iamtrebuh/status/2011260468975771862)：独立创业者，在 VPS 上运行 4 个 agent
- [@jdrhyne](https://openclaw.ai/showcase)：运行 15+ agents，3 台机器，1 个 Discord 服务器
- [@danpeguine](https://openclaw.ai/showcase)：两个不同的 OpenClaw 实例在同一个 WhatsApp 群组协作

---

### 2. n8n 工作流编排（n8n Workflow Orchestration）

**适用场景**：需要与大量外部 API 集成，但不想让 AI agent 直接管理 API 密钥

**核心痛点**：
- **无可见性**：agent 构建的集成代码难以检查
- **凭证泛滥**：每个 API 密钥都在 agent 环境中，容易泄露
- **浪费 token**：确定性子任务（发邮件、更新表格）消耗 LLM 推理 token

**解决方案**：
OpenClaw 通过 webhook 将所有外部 API 交互委托给 n8n 工作流

**工作流程**：
```text
1. Agent 设计工作流
   ↓
2. Agent 通过 n8n API 创建工作流（包含 webhook 触发器）
   ↓
3. 用户在 n8n UI 中手动添加凭证
   ↓
4. 用户锁定工作流（防止 agent 修改）
   ↓
5. Agent 调用 webhook（只知道 URL，不知道 API 密钥）
```

**架构图**：
```text
┌──────────────┐     webhook call      ┌─────────────────┐     API call     ┌──────────────┐
│   OpenClaw   │ ───────────────────→  │   n8n Workflow   │ ─────────────→  │  External    │
│   (agent)    │   (no credentials)    │  (locked, with   │  (credentials   │  Service     │
│              │                       │   API keys)      │   stay here)    │  (Slack, etc)│
└──────────────┘                       └─────────────────┘                  └──────────────┘
```

**优势**：
1. **可观察性**：n8n 的可视化 UI 可以检查每个工作流
2. **安全性**：凭证隔离，agent 永远不接触 API 密钥
3. **性能**：确定性工作流不消耗 LLM token
4. **审计追踪**：n8n 记录每次执行的输入/输出
5. **400+ 集成**：n8n 已有大量现成的集成节点

**快速开始**：
使用社区维护的 Docker Compose 栈：
```bash
git clone https://github.com/caprihan/openclaw-n8n-stack.git
cd openclaw-n8n-stack
cp .env.template .env
# 添加 Anthropic API key
docker-compose up -d
```

提供：
- OpenClaw (端口 3456)
- n8n (端口 5678)
- 共享 Docker 网络
- 预构建的工作流模板

**关键洞察**：
- **三赢**：可观察性 + 安全性 + 性能
- **构建 → 测试 → 锁定**：锁定工作流防止 agent 静默修改
- **免费的审计追踪**：n8n 自动记录所有执行

**灵感来源**：
- [@SimonHoiberg](https://x.com/SimonHoiberg/status/2020843874382487959)
- [openclaw-n8n-stack](https://github.com/caprihan/openclaw-n8n-stack)

---

## 其他值得关注的案例

### 社交媒体类
- **Daily Reddit Digest**：基于偏好总结 subreddit 摘要
- **Daily YouTube Digest**：订阅频道的每日视频摘要
- **Multi-Source Tech News Digest**：从 109+ 来源聚合科技新闻（RSS、Twitter、GitHub、网络搜索）

### 创意与构建类
- **Goal-Driven Autonomous Tasks**：脑暴目标，agent 自动生成、调度和完成任务
- **YouTube Content Pipeline**：自动化视频创意挖掘、研究和跟踪
- **Multi-Agent Content Factory**：Discord 中的多 agent 内容流水线

### 基础设施与 DevOps
- **Self-Healing Home Server**：具有 SSH 访问、自动 cron 任务和自愈能力的基础设施 agent

### 生产力类
- **Autonomous Project Management**：使用 STATE.yaml 模式协调多 agent 项目
- **Multi-Channel AI Customer Service**：统一 WhatsApp、Instagram、Email、Google Reviews 的 AI 客服
- **Phone-Based Personal Assistant**：通过电话访问 AI agent
- **Personal CRM**：从邮件和日历自动发现和跟踪联系人
- **Second Brain**：发送任何内容给 bot 记忆，通过 Next.js 仪表板搜索

### 研究与学习类
- **AI Earnings Tracker**：跟踪科技/AI 财报
- **Personal Knowledge Base (RAG)**：通过聊天添加 URL、推文、文章构建可搜索知识库
- **Semantic Memory Search**：为 OpenClaw markdown 记忆文件添加向量语义搜索

---

## 可应用到我们系统的实践

### 1. 立即可用
✅ **多 Agent 团队模式**
- 我们已经创建了 3 个 agent（主助手、研究助手、编码助手）
- 可以进一步完善：
  - 添加共享记忆结构（GOALS.md、DECISIONS.md、PROJECT_STATUS.md）
  - 为每个 agent 配置定时任务
  - 设置更明确的角色和个性

### 2. 短期可实施
🔄 **n8n 工作流编排**
- 安装 n8n
- 将外部 API 集成（飞书、邮件等）迁移到 n8n
- 提高安全性和可观察性

🔄 **定时任务系统**
- 配置每日晨会总结
- 自动拉取关键指标
- 定期内容创意生成

### 3. 中期规划
📋 **知识库系统**
- 实现 Personal Knowledge Base (RAG)
- 添加 Semantic Memory Search
- 构建 Second Brain 功能

📋 **自动化工作流**
- Daily Digest（Reddit、YouTube、Tech News）
- 自动化项目管理
- 健康与症状追踪

### 4. 长期愿景
🎯 **完整的 AI 团队生态**
- 15+ 专业化 agent
- 跨平台协作（Telegram、Discord、WhatsApp）
- 自主任务生成和执行
- 自愈系统

---

## 安全注意事项

⚠️ **重要警告**：
- 社区技能和第三方依赖可能存在严重安全漏洞
- 始终审查技能源代码
- 检查请求的权限
- 避免硬编码 API 密钥或凭证
- 你对自己的安全负全责

---

## 参考资源

- [awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [OpenClaw Showcase](https://openclaw.ai/showcase)
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

---

**创建时间**：2026-02-22 19:03
**最后更新**：2026-02-22 19:03
