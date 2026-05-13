# Skill Backlog From Chat (2026-02-27)

## P0 - 已落地
1. `openclaw-autonomy-hardening`
- 目的: 一键处置审批卡点、模型漂移、cron 卡死、锁冲突、持续派单。
- 路径: `~/.codex/skills/openclaw-autonomy-hardening/SKILL.md`

## P1 - 建议下一步补齐
1. `research-keyword-domain-scout`
- 触发: 用户给关键词，要求调研搜索意图、用途背景、搜索热度、域名占用和购买建议。
- 输出: 关键词意图摘要 + Google Trends 波动 + 主流后缀可用性 + 可买域名清单。

2. `bailian-model-catalog-sync`
- 触发: 用户问“百炼支持哪些模型/某模型是否可切换”。
- 输出: 控制台可用模型矩阵、provider 映射、alias、切换命令。

3. `openclaw-device-scope-repair`
- 触发: 控制台显示有权限但实际仍需批准。
- 输出: 设备 scope 对比、rotate 修复、重载验证。

4. `openclaw-cron-runbook`
- 触发: 任务需要 24h 自主运行、巡航派单、定时任务治理。
- 输出: cron 设计模板、超时策略、失败重试、日志与回执标准。

5. `openclaw-browser-ops`
- 触发: 需要浏览器自动化采集（X/竞品站点/网页任务）。
- 输出: profile 选择、失败回退、重试边界、防循环规则。

## P2 - 安全与治理
1. `openclaw-risky-actions-guard`
- 触发: 涉及高危操作（删库、批量删除、破坏性命令）。
- 输出: 双重确认模板、dry-run 先行、回滚点要求。
