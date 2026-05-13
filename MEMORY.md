# MEMORY.md - 长期记忆

## Memory Contract

- 本文件只保存：稳定规则、关键决策、长期事实、索引和路径引用
- 长报告、调研正文、执行流水、临时笔记，不得直接写在这里
- 详细内容必须移到 `memory/YYYY-MM-DD.md`、`memory/reports/` 或 `memory/<topic>.md`
- 如果某段内容已经过长，应改成“摘要 + 文件路径”

## 2026-05-13 GitHub Backup Cron 状态索引

- `.openclaw/workspace` 已成功配置 GitHub 远端备份：`https://github.com/Sliense-ysd/openclaw-main.git`
- 历史问题：早期 commit 包含 `credentials/gcp-service-account.json`，被 GitHub secret scanning 阻止。
- 解决方案：创建 orphan 分支重新初始化历史，移除敏感文件后强制推送。
- 备份策略：
  - 排除 `credentials/` 目录和所有 `.env` 文件
  - 保留核心配置（SOUL.md、USER.md、MEMORY.md、AGENTS.md）
  - 保留 memory/ 目录（但需定期清理过期文件）
  - 排除 `node_modules/` 和 `dist/` 等构建产物

## 2026-03-10 Agent 对外开场与模型切换

- 用户明确要求：不要再用“我先读上下文 / 我先读记忆 / 我先看任务记录和最近上下”这类内部动作当开场白。
- 结论：读取 `SOUL.md` / `USER.md` / `MEMORY.md` / `ACTIVE.md` / `TODO.md` 仍然保留，但必须静默执行，直接回复结论、澄清问题或执行结果。
- 用户同时要求把各 OpenClaw agents 的主模型统一切到 `local-sub2api` 这条 Claude 链路；旧的 `codex-cli` / `codesome` / `bailian` 只保留为历史信息，不再作为当前主配置。

## 2026-03-09 “龙虾”使用边界

- 主人已明确总结“龙虾”投入标准：仅当任务同时满足高频/高重复、显著占用时间、且质量要求不高或 AI 可稳定高质量交付时，才值得投入自动化资源。
- 若任务低频、时间成本低、或 AI 暂时做不到高质量，默认先人工处理，不要为了自动化而自动化。
- 以后在建议把事情交给“龙虾”之前，必须先做一次“复利强弱判断”，避免把有限资源砸在复利很弱的任务上。

## 2026-03-09 文件存放规范

- 项目开发必须放在 `/Users/openclaw/workspace/<project>/` 对应目录下执行。
- 不要把仓库 clone 到 `/tmp/`，避免临时目录重复下载和上下文分裂。
- Git 操作固定在项目目录内执行：`git pull`、`git add`、`git commit`、`git push`。
- Coding Agent 执行代码任务时，默认显式指定 `workdir:/Users/openclaw/workspace/<project>`。

## 2026-03-06 权限与 Agent 状态

- 用户已明确要求把 Telegram 侧 agent `exec/elevated` 权限全开放，不再只限制主 agent 或单一 Telegram 用户。
- 当前全局权限基线：
  - `agents.defaults.elevatedDefault = full`
  - `tools.elevated.allowFrom.telegram = ["*"]`
  - `tools.exec.security = full`
  - `tools.exec.ask = off`
  - 不再对单独 agent 设置 `tools.elevated.enabled = false`
- 2026-03-06 非 main agent 探活结果：
  - `research/product/growth/operations/backlink/task/kol/users` 均可正常返回
  - `coding` 可返回，但当前仍回退到 `zhipu-anthropic`
- `coding` 的 Codex / Claude Code 灰度路由已经配置好，但 CLI backend 目前未完全打通；后续修复应优先检查 `codex-cli`、`claude-cli` 和 `openai-codex` OAuth 状态。

## 2026-02-27 防重复犯错规则（必须执行）

### 本轮新增（Telegram/Feishu 无回复专项）
- 事故总入口：`memory/openclaw-incident-prevention-2026-02-27.md`
- 排障技能：`~/.codex/skills/openclaw-incident-guard/SKILL.md`
- 每次无回复故障必须先跑快照：`bash ~/.codex/skills/openclaw-incident-guard/scripts/snapshot.sh`
- 修复完成前必须做真实渠道验证（不能只看 CLI 成功）

### API / Provider 规则
- Coding Plan 仅使用以下端点：
  - OpenAI compat: `https://coding.dashscope.aliyuncs.com/v1`
  - Anthropic compat: `https://coding.dashscope.aliyuncs.com/apps/anthropic`
- `sk-sp-*` 仅用于 Coding Plan，不与按量计费端点混用。
- 切换 provider/model 后必须执行两层验证：
  1. provider probe
  2. agent probe（`openclaw agent --agent <id> --message '请仅回复 ok'`）

### Agent 切换规则
- 支持按 agent 定向切换；默认不要全量切换。
- 新模型先在单 agent 灰度验证通过，再扩大范围。
- 已知：`kimi-k2.5` 在当前流程里可能出现 tool-call 兼容问题，不能直接全员切。

### 上下文管理规则
- 清理会话前先备份，再只清目标 agent 的会话映射。
- 会话上下文 ≠ 长期记忆；长期记忆只保留稳定规则和结论。
- `MEMORY.md` / `memory/*.md` 禁止写入敏感信息（token、密码、密钥）。

### 浏览器自动化规则
- 页面动态重渲染时，`ref` 可能失效；关键步骤前要重抓快照，或用 selector/evaluate 兜底。
- 自动化默认不做不可逆操作（例如提交按钮）除非用户明确要求。
- 每次执行保留 before/after 快照和截图，便于回溯。

### 执行入口（Skill）
- `~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh preflight`
- `~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh context-report --agent <id>`
- `~/.openclaw/workspace/skills/openclaw-ops-guardrails/scripts/ops-guardrails.sh context-prune --agent <id> --yes`

## 决策记录

### 多实例架构（2026-02-23）
**决策**：采用 OpenClaw 官方推荐的"单 Gateway + 多 Agent"架构
**理由**：
- 资源占用低（25% 内存节省）
- 维护成本小（90% 维护时间节省）
- 扩展性强（添加 Agent 无需重启 Gateway）
- 故障隔离（单个 Agent 故障不影响其他）

**结果**：
- Gateway: 单一（端口 18789）
- Agents: 3 个（home、work、coding）
- Bindings: 每个 Agent 绑定独立 Telegram Bot

### API Failover 配置（2026-02-23）
**决策**：使用 OpenClaw 原生 failover 机制
**理由**：
- 避免重复造轮子
- 自动处理 auth/billing/rate-limit 错误
- Session 级缓存，避免频繁切换

**结果**：
- Fallbacks: 4 个模型自动切换
  1. codesome/claude-sonnet-4-5-20251022
  2. moonshot/moonshot-v1-128k
  3. friend/claude-sonnet-4-5-20251022
  4. kimi/kimi-for-coding

### OpenClaw 自治稳定化（2026-02-27）
**决策**：将“权限/模型/巡航/锁冲突”的处置流程固化成 Skill + Memory，作为默认运维动作。
**结果**：
- 新增 Skill：`~/.codex/skills/openclaw-autonomy-hardening/SKILL.md`
- 新增故障矩阵：`~/.codex/skills/openclaw-autonomy-hardening/references/failure-patterns.md`
- 新增复盘记录：`~/.openclaw/workspace/memory/openclaw-autonomy-lessons-2026-02-27.md`
- 新增技能待办：`~/.openclaw/workspace/memory/skill-backlog-from-chat-2026-02-27.md`
- 巡航策略更新：每 15 分钟快速派单 + `active-task.md` 新鲜度校验

## 用户偏好

### 工作风格
- **简洁直接**：简单问题直接给答案，复杂问题详细拆解
- **结论先行**：沟通时先说结论，再补充细节
- **灵活切换**：简单问题简洁，复杂问题详细
- **快速试错**：不纠结完美，边做边调整
- **务实高效**：先自己想办法解决，解决不了再问

### 沟通风格
- **语言**：中文为主，技术术语用英文
- **反馈**：做错了直接承认，不找借口
- **主动性**：发现问题主动提出，不等主人发现
- **短句分段**：Telegram 场景默认一行一个重点，不写大段混合信息
- **静默内部流程**：默认不对外播报读记忆、读规则、读 skill、恢复上下文
- **反模板化**：避免“我先按工作区规则/先读上下文”这类固定开场

### 回复格式决策（2026-03-09）
- 主 Agent 对外回复改为“短句 + 分段 + 重点拆开”。
- 内部启动动作（读取 SOUL/USER/MEMORY/skills/output-standard）保留，但默认静默执行，不再对外播报。
- 默认按“结论 / 证据 / 下一步”组织；除非主人要求长文，否则不输出大段密集正文。

### 决策风格
- **快速试错**：先做原型，快速验证
- **重视效果**：看实际结果，不纠结过程
- **自动化优先**：喜欢自动化，讨厌重复劳动

## 项目背景

### OpenClaw 架构
- **Gateway**: 18789（主实例）
- **Agents**:
  - home（家庭助手）→ Bot: default
  - work（工作助手）→ Bot: research (8513427490)
  - coding（技术助手）→ Bot: coding-bot (8300082824)
- **Main Agent**: 默认路由，fallback 到备用模型

### Bot Credentials
- **default**: secret stored in `~/.openclaw/credentials/*.env` (redacted)
- **research**: secret stored in `~/.openclaw/credentials/*.env` (redacted)
- **coding-bot**: secret stored in `~/.openclaw/credentials/*.env` (redacted)

### 技术栈
- **OpenClaw**: Gateway + Telegram Bot
- **Playwright**: 浏览器自动化
- **飞书 Bitable**: 数据管理
- **Node.js + Shell**: 脚本自动化
- **Semrush**: 通过 3ue 代理

### 当前项目
1. **外链监控与提交系统**
   - 自动监控：Semrush API + X.com AI tab
   - 自动提交：飞书 Bitable
   - 数据汇总：定时任务整理

2. **多 OpenClaw 实例管理**
   - main: 主要 Gateway 和默认 Agent
   - home: 家庭助手（日历、消息、智能家居）
   - work: 工作助手（任务、文档、研究）
   - coding: 技术助手（代码审查、调试、优化）

3. **社媒监控体系**
   - X 新词监控（cron 任务）
   - 品牌提及监控
   - 竞品社媒动态

## 技能和工具

### 已配置的 Skills
- **semrush-monitor**: 外链监控
- **competitor-backlinks**: 竞品外链分析
- **backlink-submission**: 外链自动提交

### 已配置的 API 供应商
- zhipu-anthropic: Claude Sonnet 4.5
- codesome: Claude Sonnet 4.5, Opus 4.6
- moonshot: Moonshot V1 (8K, 32K, 128K)
- friend: Claude Sonnet 4.5
- kimi: Kimi For Coding

### 脚本和自动化
- guard.sh: Gateway 守护脚本（每 30 秒检查）
- auto-proxy.sh: 代理端口自动检测（每 5 分钟）
- api-test.sh: API 健康检查
- provider-switch.sh: API 供应商手动切换

## 重要配置

### 代理配置
- **Clash Verge 端口**: 7897
- **所有 OpenClaw 实例代理**: http://127.0.0.1:7897

### 端口配置
- **Main Gateway**: 18789
- **Browser 中继**: 18790
- **Canvas**: 18791

## 时间线

### 2026-02-22
- 初始配置：SOUL.md + USER.md
- 配置 Telegram Bot
- 配置浏览器环境

### 2026-02-23
- 研究多实例最佳实践：发现官方推荐"单 Gateway + 多 Agent"
- 配置 API Failover：4 个 fallback 模型自动切换
- 优化 Guard 脚本：每 30 秒检查 Gateway
- 优化 auto-proxy 脚本：避免频繁重启 Gateway
- 创建 Bot Tokens：research (8513427490), coding-bot (8300082824)

---

## 周汇总 2026-02-22 ~ 2026-02-27

### 竞品洞察
- OpenAI Sora 2 正式发布，音频+视频一体化成为新标准
- xAI 重组四大团队，Imagine 日产 5000 万视频；Grok CLI / Grok Build Beta 即将发布
- Anthropic 收购 Vercept AI，推出 Cowork & 10 种企业插件，调整安全承诺（不再因安全滞后暂停部署）
- DeepSeek V4 准备发布（使用 NVIDIA Blackwell 训练），拒绝向 NVIDIA/AMD 提供新模型访问
- Qwen 3.5 Medium 发布，击败暴力扩展方法
- Cursor AI 编码代理重大更新，AI 编码工具竞争加剧
- OpenAI 退役 GPT-4o 及旧版模型
- Google Gemini 3.1 Pro、Claude Opus 4.6 / Sonnet 4.6、GPT-5.3-Codex 均已发布

### 产品策略
- 确立"单 Gateway + 多 Agent"架构为长期方向（节省 75% 内存，90% 维护时间）
- 10 个专业化 Agent 创建完成（main/work/coding/research/product/growth/operations/logistics/backlink/social）
- 7 个 Telegram Bot 绑定完成，Bindings 路由就绪
- 飞书任务池设计完成（20 字段 + 4 视图）
- Telegram 单入口派单协议落地（@DDbacklinkbot → sessions_send 协作 → 回群汇总）
- Agent 间通信确认走 sessions_send（Telegram bot 互不可见为平台限制）

### 技术方案
- P0 安全整改完成：groupPolicy 收敛为 allowlist，移除 allowFrom=*，critical=0
- 密钥泄露事件处置：扫描 200 文件 / 20 命中，子 agent 权限护栏已加固，sandbox.mode 改为 non-main
- P0 密钥轮换清单已建立（LLM Provider / Telegram Bot / Feishu 应用密钥），待执行
- 配置文件保护规则确立：禁止子 agent 读写全局配置、禁止 doctor --fix / gateway restart
- 官方最佳实践对齐审计完成：识别 4 个关键缺口（多 workspace 记忆不齐、模型未分层、技能安全治理不足、配置 SSOT 不清）
- Agent 全员巡航机制上线（launchd 每 15 分钟），飞书投递验证通过
- X 新词监控 cron 运行稳定，累计追踪 40+ AI 行业动态

### 待办事项
- [ ] P0：配置 workspace Git 远程仓库（backup-github cron 推送失败）
- [ ] P0：执行密钥轮换（LLM Provider + Telegram Bot + Feishu 应用密钥）
- [ ] P0：一键初始化脚本（开机后所有环境自动就绪）
- [ ] P1：统一多 agent workspace 骨架（SOUL/MEMORY/ACTIVE/HEARTBEAT）
- [ ] P1：模型角色分层（协调者用高推理模型，执行者用成本优模型）
- [ ] P1：清理 Gateway 启停链路（消除 wrapper + service 叠加冲突）
- [ ] P1：修复 Cron 投递链路，恢复必要定时任务
- [ ] P2：凭据集中管理，去除脚本硬编码
- [ ] P2：补齐 logistics/social Bot Token
- [ ] P2：社媒监控体系搭建（X 品牌提及 + 竞品动态 → 飞书 Bitable）

## Skills 管理

### 创建 Telegram Agent Skill（2026-03-05）
- **位置**：`~/.openclaw/skills/create-telegram-agent/`
- **用途**：完全自动化创建 Telegram Agent
- **目标用户**：需要快速创建新 Telegram bot 的管理员
- **核心功能**：
  - 一键创建 agent 和 workspace
  - 自动配置 Telegram bot token
  - 自动配置 bindings
  - 自动设置 requireMention: true（避免回声问题）
  - 自动重启 Gateway
  - 自动验证配置
- **经验教训内置**（重要！）：
  - ✅ requireMention: true - 避免所有 bot 同时回复
  - ✅ 账号级别配置 - 优先级最高
  - ✅ 自动重启 Gateway - 配置立即生效
  - ✅ 标准 workspace 结构
  - ✅ 配置自动备份
- **快速使用**：
  ```bash
  cd ~/.openclaw/skills/create-telegram-agent
  ./create-telegram-agent.sh <agent-id> <agent-name> <bot-token> [model-id] [emoji]
  
  # 示例
  ./create-telegram-agent.sh kol "KOL管理" "8616581450:AAEgCWbv..." codesome/claude-sonnet-4-5-20251022 🌟
  ```
- **文档**：
  - `SKILL.md` - 完整功能文档
  - `LESSONS_LEARNED.md` - 经验教训（必读！）
  - `README.md` - 快速开始指南
- **优势**：
  - 完全自动化，无需手动配置
  - 避免所有已知的坑
  - 配置自动备份，安全可靠
  - 自动验证，确保配置正确
