# Incident Catalog

## A. Telegram @提及无回复（`no-mention`）
- Symptom:
  - Logs: `telegram-auto-reply ... reason=no-mention`
- Root cause:
  - `requireMention` 开启，但入口 agent 的 `groupChat.mentionPatterns` 未覆盖用户真实提及写法（中文别名、全角 `＠`、角色名与 bot username 不一致）。
- Fix:
  - 在入口 agent（通常 `main`）补齐 `groupChat.mentionPatterns`。
  - 统一单入口命名，避免文案仍引用旧 bot 名称。
- Verify:
  - 群里发送 `@产品经理` / `@开发助手` / `@主 agent` 其中任一，观察是否触发回应。
  - 日志不再新增该消息对应的 `no-mention`。

## B. `spawn docker ENOENT`
- Symptom:
  - `Agent failed before reply: spawn docker ENOENT`
- Root cause:
  - 子 agent 运行路径触发 sandbox/docker，但运行环境无法找到 `docker` 或 PATH 继承异常。
- Fix:
  - 校验 `which docker`。
  - 检查 sandbox 配置是否与当前主机能力匹配（必要时改为非 docker 依赖路径）。
  - 重启 Gateway 并复测。
- Verify:
  - 同场景不再出现 `spawn docker ENOENT`。

## C. Gateway `1006` / CLI 显示 unreachable
- Symptom:
  - `gateway closed (1006 abnormal closure...)`
  - `openclaw health` 或 `openclaw status` 间歇失败。
- Root cause:
  - Gateway 进程重启窗口、服务冲突、或本地 loopback 连接瞬断。
- Fix:
  - `openclaw gateway restart`
  - 复查 `openclaw gateway status` 与 `openclaw health`
  - 清理重复/冲突服务（仅在明确冲突时）
- Verify:
  - 连续两次 `openclaw health` 成功。

## D. 模型限流/冷却导致“看起来没回复”
- Symptom:
  - `API rate limit reached`
  - `No available auth profile ... cooldown`
  - `FailoverError`
- Root cause:
  - 主模型短时不可用，fallback 链过短或 fallback 也不稳定。
- Fix:
  - 为关键 agent（`main`, `coding`）配置 2 层以上 fallback（跨 provider）。
  - 使用 `openclaw models status --agent <id> --json` 检查 `unusableProfiles`。
- Verify:
  - 主模型不可用时仍能由 fallback 返回结果。

## E. Cron 发错渠道（应发飞书却发 Telegram）
- Symptom:
  - Cron 输出来源显示 `sourceChannel=telegram`。
- Root cause:
  - 旧 cron 未删除，或新任务未显式指定 `--channel` 与 `--to`。
- Fix:
  - `openclaw cron list`
  - 删除旧任务，重建时显式设置渠道与目标。
- Verify:
  - 触发一次立即测试，确认消息到正确渠道和群。

## F. Browser Relay 看似可达但 agent 无法打开浏览器
- Symptom:
  - 扩展页面显示 relay reachable，但 agent 实际浏览器工具不可用。
- Root cause:
  - Agent 没有可用 browser 能力路径（沙箱/权限/会话 attach 状态不一致）。
- Fix:
  - 确认 relay 端口一致（默认 18792）。
  - 确认浏览器标签页已 attach。
  - 在目标 agent 执行一次最小 browser 操作验证。
- Verify:
  - 目标 agent 完成一次真实页面访问任务。

## G. Workspace 骨架缺失（如 `memory/active-task.md`）
- Symptom:
  - 巡航或派单超时，报告缺少 `active-task.md`。
- Root cause:
  - agent workspace 初始化不一致。
- Fix:
  - 统一 7 个 agent 的 workspace skeleton（SOUL/MEMORY/HEARTBEAT/active-task）。
- Verify:
  - 巡航任务全绿，无缺文件报错。

## Definition of Done (DoD)
- 配置已备份并可回滚。
- 修复后有“通道真实消息”验证，不仅是 CLI 成功。
- 同类错误在最近日志窗口（3-5 分钟）无新增。
- memory 已记录“根因-修复-证据-防再犯规则”。
