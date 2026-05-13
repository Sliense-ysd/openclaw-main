# OpenClaw 官方对齐最佳实践（2026-02-25）

基于 X 帖子 [shao__meng/status/2025864146466529519](https://x.com/shao__meng/status/2025864146466529519) 的 5 条原则，按官方文档做对齐，并结合当前本机配置做差异检查。

## 1. 结论先行

- 这 5 条原则整体方向是对的，但其中一部分是「社区经验」，不是官方硬约束。

官方硬约束主要集中在 4 件事：
1. 技能安全边界（技能无沙箱，脚本可执行，必须审计）。
2. 上下文持久化（compaction 后不能依赖纯对话记忆）。
3. 失败回退（fallback/failover 必须明确配置）。
4. 自动化职责边界（cron 与 heartbeat 适用场景不同）。

## 2. 帖子观点 vs 官方标准

| 帖子原则 | 官方是否支持 | 官方口径 | 结论 |
|---|---|---|---|
| 安全第一，不盲装技能 | 是 | Skills 会注入提示词，且可调用脚本；官方明确要求只信任可信来源并审计脚本；安全文档强调最小权限和审批。 | 完全对齐，且应升级为强制流程。 |
| 文件即大脑（MEMORY/日志/任务文件） | 是 | 官方内存与 compaction 文档都强调：长期信息应写入工作区文件，不应只依赖历史对话。 | 完全对齐。 |
| 模型分层（主/子任务不同模型） | 部分 | 官方支持多模型与 failover，但没有强制「Opus=主、Sonnet=子」这类固定搭配。 | 能力对齐，型号搭配属于团队策略。 |
| Cron 驱动一切 | 部分 | 官方同时提供 cron 和 heartbeat，并给出选择边界（固定时点 vs 周期检查）。 | 应改成「自动化驱动一切，cron/heartbeat 按场景分工」。 |
| 极简技能哲学（优先 SKILL.md） | 是 | 官方 skills 体系允许只有 SKILL.md；脚本是可选增强，不是必选。 | 完全对齐。 |

## 3. 当前环境差异（本机实测）

检查时间：2026-02-25  
检查范围：`~/.openclaw/openclaw.json`、`~/.openclaw/cron/jobs.json`、`~/.openclaw/workspace*`、`~/.openclaw/workspace/skills`

### 3.1 结构与记忆落地

- 主工作区 `~/.openclaw/workspace` 已有 `SOUL.md`、`MEMORY.md`、`HEARTBEAT.md`、`memory/`、`skills/`。
- 但 `ACTIVE-TASK.md` 缺失（且官方模板更常见命名是 `ACTIVE.md`）。
- 多个 agent workspace 缺 `MEMORY.md`/`memory/`/`skills/`（如 `workspace-coding`、`workspace-work`、`workspace-social` 等）。

结论：主 workspace 基本可用，但多 agent 记忆体系不一致，容易出现上下文在 compaction 后丢失。

### 3.2 模型分层与回退

- 当前 `openclaw.json` 中 10 个 agent 大多使用同一个主模型 `zhipu-anthropic/claude-sonnet-4-5-20251022`。
- `agents.defaults.model.fallbacks` 仅 1 条，分层深度偏浅。
- `agents.json` 与 `openclaw.json` 存在并存且内容不一致（模型/绑定定义不一致）。

结论：有回退能力，但未形成「协调者/执行者」分层；且配置存在单一事实源（SSOT）不清问题。

### 3.3 Cron 与 Heartbeat

- `cron/jobs.json` 仅 1 个任务处于启用状态（`social` 的「内容平台热点监控」）。
- 其余历史任务多数禁用，且曾出现 `Unsupported channel: telegram` 与 `cron announce delivery failed`。
- 主 workspace 的 `HEARTBEAT.md` 目前是空模板（无实际心跳检查逻辑）。

结论：自动化存在，但没有形成「少数稳定心跳 + 明确 cron 报告」的运行基线。

### 3.4 技能安全与极简化

- 发现多个技能目录缺 `SKILL.md`（如 `backlink-submission`、`competitor-backlinks`、`semrush-monitor`、`telegram-setup`）。
- `feishu-calendar` 这类技能脚本较多（11 个脚本 + 依赖），但缺少统一的安全审计标记。
- 工作区与技能文档中存在明文凭证痕迹（应迁移到环境变量/密钥管理）。

结论：当前技能体系偏「代码驱动」，与“优先 SKILL.md + 最小依赖”的官方安全倾向有差距。

## 4. 官方对齐后的推荐基线

### 4.1 统一每个 Agent 的工作区骨架

```text
workspace-<agent>/
├── SOUL.md
├── MEMORY.md
├── ACTIVE.md           # 或 ACTIVE-TASK.md，但建议统一命名
├── HEARTBEAT.md
├── memory/
│   └── YYYY-MM-DD.md
└── skills/
    └── <skill>/SKILL.md
```

### 4.2 技能安全流程（必须执行）

- 仅安装可追溯来源的技能。
- 含 `scripts/` 的技能先逐行审计，再启用。
- 优先无脚本、无依赖技能（只写 SKILL.md + 内置工具流程）。
- 所有凭证只放环境变量，不写入 `skill.json`、README、memory 文档。

### 4.3 模型与路由

- 主协调 agent 使用高推理模型，执行型 agent 使用成本更优模型。
- 每个关键 agent 至少 2 个跨供应商 fallback。
- 明确一个配置为 SSOT（建议只保留 `openclaw.json` 作为运行真值）。

### 4.4 自动化编排

- `heartbeat`: 做「周期检查类」任务（收件箱、异常扫描、队列状态）。
- `cron`: 做「固定时点」产出（晨报、日报、周报）。
- 对外投递统一走可验证的 channel/session 路由，避免 `last` 导致不可控投递失败。

## 5. 你现在的使用方式是否“对”

- 方向上是对的：你已经具备多 agent、多渠道、模型 fallback、定时任务基础。

但离官方推荐的「可持续稳定态」还有 4 个关键缺口：
1. 多 workspace 记忆文件不齐。
2. 模型未完成角色分层。
3. 技能安全治理不足（含明文凭证与缺 SKILL.md）。
4. 配置存在并存漂移（`openclaw.json` vs `agents.json`）。

## 6. 参考链接（官方 + 原帖）

- 原帖：[X / shao__meng](https://x.com/shao__meng/status/2025864146466529519)
- Skills: [docs.openclaw.ai/skills](https://docs.openclaw.ai/skills)
- Skills 概念: [docs.openclaw.ai/concepts/skills](https://docs.openclaw.ai/concepts/skills)
- Security: [docs.openclaw.ai/security](https://docs.openclaw.ai/security)
- Memory: [docs.openclaw.ai/memory](https://docs.openclaw.ai/memory)
- Prompt Compaction: [docs.openclaw.ai/concepts/prompt-compaction](https://docs.openclaw.ai/concepts/prompt-compaction)
- Agent Workspace: [docs.openclaw.ai/concepts/agent-workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- Failover: [docs.openclaw.ai/models/failover](https://docs.openclaw.ai/models/failover)
- Cron Jobs: [docs.openclaw.ai/automation/cron-jobs](https://docs.openclaw.ai/automation/cron-jobs)
- Heartbeat: [docs.openclaw.ai/gateway/heartbeat](https://docs.openclaw.ai/gateway/heartbeat)
- Multi-Agent: [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent)
- Provider Routing: [docs.openclaw.ai/channels/provider-routing](https://docs.openclaw.ai/channels/provider-routing)
