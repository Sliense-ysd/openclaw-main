# Skillization Backlog - 2026-02-27

## 已沉淀
1. `bot-diagnostics`：无回复故障诊断（pairing/allowlist/routing/token/probe）。
2. `openclaw-agent-provider-switch`：按 agent 安全切换 provider/model 并验证。
3. `openclaw-incident-guard`：这次新增，覆盖 no-reply/1006/ENOENT/rate-limit/cron 路由错配。

## 建议继续沉淀（按优先级）
1. `openclaw-channel-routing-guard`
- 目标：防止“主入口配置与群内实际 @调用方式”漂移。
- 核心：自动检查 bindings、group requireMention、mentionPatterns、系统提示文案一致性。

2. `openclaw-cron-handover`
- 目标：把定时任务从一个 agent 平滑交接到另一个 agent，避免重复任务和错误渠道投递。
- 核心：list -> diff -> delete old -> add new -> immediate test -> rollback。

3. `openclaw-workspace-skeleton-sync`
- 目标：统一 7 个 agent workspace 骨架并巡检缺失文件。
- 核心：自动补齐 `SOUL.md / MEMORY.md / HEARTBEAT.md / memory/active-task.md`。

4. `openclaw-browser-relay-check`
- 目标：解决“扩展显示 relay 可达但 agent 无法操作浏览器”。
- 核心：端口一致性、attach 状态、目标 agent 浏览器能力探针。

5. `openclaw-security-redaction`
- 目标：避免 memory/log/doc 中再次出现 token 泄露。
- 核心：扫描敏感字段并自动脱敏输出报告。
