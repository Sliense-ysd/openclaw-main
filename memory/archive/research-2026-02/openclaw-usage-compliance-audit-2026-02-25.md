# OpenClaw 使用与官方标准差异审计（2026-02-25）

## 1. 审计信息

- 审计时间: 2026-02-25
- 审计范围:
  - 运行状态与服务编排
  - 主配置与通道策略
  - 多实例脚本与自动化脚本
  - Cron 任务投递状态
- 审计对象:
  - `~/.openclaw/openclaw.json`
  - `~/Library/LaunchAgents/*.openclaw*.plist`
  - `~/.openclaw/*.sh`
  - `~/.openclaw/cron/jobs.json`
  - `~/.openclaw/logs/gateway*.log`

## 2. 执行快照

- OpenClaw 版本: `2026.2.22-2`
- 主 Gateway 端口: `18789`
- Agents 数量: `10`
- 渠道: Telegram + Feishu（多账号）
- Cron 任务: `5`（当前全部 disabled）

主要诊断命令（只读）:

- `openclaw status --all`
- `openclaw security audit --deep --json`
- `openclaw doctor --non-interactive`
- `openclaw gateway status`
- `lsof -nP -iTCP:18789 -sTCP:LISTEN`

## 3. 总结（风险分级）

- Critical: 2
- High: 4
- Medium: 4
- Low: 2

说明:

- `openclaw security audit --deep --json` 返回 `2 critical`（开放群策略 + 高权限工具暴露）。
- 另外补充了运行和运维层面的偏差问题（脚本与服务编排、实例一致性、Cron 投递链路等）。

## 4. 详细问题清单

### C-01 开放群策略与高权限工具组合暴露（Critical）

- 现状:
  - Telegram/Feishu 大量账号使用 `groupPolicy: "open"`。
  - 并且审计结果显示 runtime/fs/elevated 暴露。
- 风险:
  - 群聊 prompt injection 可触发高权限操作，影响命令执行与文件系统。
- 证据:
  - `~/.openclaw/openclaw.json:366`
  - `~/.openclaw/openclaw.json:438`
  - `openclaw security audit --deep --json`（`security.exposure.open_groups_with_elevated`）
  - `openclaw security audit --deep --json`（`security.exposure.open_groups_with_runtime_or_fs`）
- 官方基线:
  - 优先 `groupPolicy="allowlist"`，消息通道使用最小工具权限。

### C-02 开放接入白名单配置过宽（Critical）

- 现状:
  - 多账号 `allowFrom: ["*"]`。
  - Feishu 顶层也存在 `allowFrom: ["*"]`。
- 风险:
  - 未受限发送者可直接触发机器人能力。
- 证据:
  - `~/.openclaw/openclaw.json:379`
  - `~/.openclaw/openclaw.json:388`
  - `~/.openclaw/openclaw.json:441`
  - `~/.openclaw/openclaw.json:454`
- 官方基线:
  - 生产建议使用 allowlist，限制到可信用户/群组。

### H-01 凭据明文分布过广（High）

- 现状:
  - token/apiKey 分布在主配置、agent auth、provider 脚本、LaunchAgent 环境变量。
- 风险:
  - 泄露面扩大，轮换和审计成本高。
- 证据:
  - `~/.openclaw/openclaw.json:372`
  - `~/.openclaw/agents/main/agent/auth.json:2`
  - `~/.openclaw/provider-switch.sh:14`
  - `~/Library/LaunchAgents/ai.openclaw.gateway.plist:37`
- 官方基线:
  - 密钥最小暴露、集中管理、避免在多脚本硬编码。

### H-02 群策略与工具沙箱未做渠道隔离（High）

- 现状:
  - 审计输出显示 `sandbox=off`、`fs.workspaceOnly=false` 暴露在 agents defaults/list 上下文。
- 风险:
  - 来自开放群的请求可能触达 runtime/fs 写能力。
- 证据:
  - `openclaw security audit --json`（`security.exposure.open_groups_with_runtime_or_fs`）
- 官方基线:
  - 暴露到外部渠道的 agent 建议 `sandbox.mode="all"`，文件权限限制到 workspace。

### H-03 多实例脚本与官方单网关建议存在偏差（High）

- 现状:
  - 保留多实例脚本（`backlink/content/monitor`）与 profile 服务生成脚本。
  - 但当前实际上仅主实例目录存在，脚本与落地状态不一致。
- 风险:
  - 维护复杂度高，误操作概率增加。
- 证据:
  - `~/openclaw-fleet.sh:4`
  - `~/create-profile-services.sh:4`
  - 目录检查: 仅存在 `~/.openclaw`、`~/.openclaw-main`。
- 官方基线:
  - 大多数场景推荐单机单 gateway + 多 agents。

### H-04 Gateway 启动链路存在重复拉起/冲突迹象（High）

- 现状:
  - 日志出现重复“验证配置 -> 启动 Gateway”。
  - 同时存在“another gateway instance is already listening”冲突记录。
- 风险:
  - 服务抖动、状态误判、故障排查困难。
- 证据:
  - `~/.openclaw/logs/gateway-wrapper.log:659`
  - `~/.openclaw/logs/gateway.err.log:24713`
  - `~/.openclaw/logs/gateway.err.log:24715`
- 官方基线:
  - 使用官方 service 管理命令统一启停，避免外层循环重启脚本与 service 叠加。

### M-01 Telegram bindings 与账号配置不一致（Medium）

- 现状:
  - Telegram bindings 有 10 条，但 telegram accounts 仅 7 个。
  - `logistics/social` 在 bindings 中存在，但账号未配置 token。
- 风险:
  - 路由失效或消息掉落，排查成本高。
- 证据:
  - `~/.openclaw/openclaw.json:288`
  - `~/.openclaw/openclaw.json:302`
  - `~/.openclaw/openclaw.json:369`
  - `openclaw channels list` 显示 logistics/social token=none

### M-02 Cron 投递链路不稳定（Medium）

- 现状:
  - 历史错误包含 `cron announce delivery failed`、`Unsupported channel: telegram`。
  - 当前所有 Cron 任务已 disabled。
- 风险:
  - 自动化任务不可用或可用性低。
- 证据:
  - `~/.openclaw/cron/jobs.json:30`
  - `~/.openclaw/cron/jobs.json:95`
  - `~/.openclaw/cron/runs/624bf14a-7a43-43cb-a304-949a8c60c43e.jsonl:34`

### M-03 插件加载告警反复出现（Medium）

- 现状:
  - 重复出现 `duplicate plugin id detected` 以及 `plugins.allow is empty` 警告。
- 风险:
  - 插件加载来源不确定，稳定性与安全边界变差。
- 证据:
  - `~/.openclaw/logs/gateway.err.log:24667`
  - `~/.openclaw/logs/gateway.err.log:24689`

### M-04 自定义脚本硬编码 Node/OpenClaw 路径（Medium）

- 现状:
  - 多处写死 `/opt/homebrew/Cellar/node/23.10.0_1/...`。
- 风险:
  - Node/OpenClaw 升级后脚本失效。
- 证据:
  - `~/create-profile-services.sh:27`
  - `~/.openclaw/gateway-wrapper.sh:9`

### L-01 keep-awake 脚本存在广泛进程终止动作（Low）

- 现状:
  - `stop-awake.sh` 提供 `pkill caffeinate` 全局终止。
- 风险:
  - 可能误杀其他业务的 caffeinate 进程。
- 证据:
  - `~/.openclaw/stop-awake.sh:27`

### L-02 状态探测在当前环境出现 EPERM 干扰（Low）

- 现状:
  - CLI 探测偶发 `connect EPERM 127.0.0.1:18789`，但 `lsof` 可见端口监听。
- 风险:
  - 容易造成“服务未运行”的误判。
- 证据:
  - `openclaw status --all`（Gateway unreachable + EPERM）
  - `lsof -nP -iTCP:18789 -sTCP:LISTEN`（PID 21291 正在监听）

## 5. 与官方标准的关键偏差摘要

- 偏差 A: 群聊默认放开（`groupPolicy=open`）且 `allowFrom=*`。
- 偏差 B: 对外聊天入口未采用最小权限工具配置（sandbox/fs/runtime 收敛不足）。
- 偏差 C: 运维上混合“官方 service + 自定义重启脚本”，可观测到冲突/重复拉起。
- 偏差 D: 脚本化多实例与实际落地实例不一致。

## 6. 修复优先级建议（先后顺序）

### P0（立即）

1. 将 Telegram/Feishu 的 `groupPolicy` 收敛到 `allowlist`。
2. 收敛 `allowFrom`，移除 `["*"]`，改为明确用户/群白名单。
3. 对外暴露 agent 启用最小工具权限（至少限制 fs/runtime）。

### P1（本周）

1. 清理并统一 Gateway 启停链路（保留一种权威路径）。
2. 处理 bindings 与账号配置不一致（补齐或移除无效绑定）。
3. 修复 Cron 投递链路并恢复必要任务。

### P2（随后）

1. 凭据集中管理与轮换，去除脚本硬编码。
2. 插件 allowlist 与重复插件来源整理。
3. 脚本路径参数化，避免依赖 Cellar 具体版本号。

## 6.1 本次实施更新（2026-02-25，单入口派单链路）

### 已实施

- 在工作区规则中落地了 Telegram 单入口派单协议，明确：
  - 入口 bot: `@DDbacklinkbot`
  - 同群派单 key 模板：`agent:<agent_id>:telegram:group:-1003759411912`
  - `sessions_send` 必须使用 `sessionKey` 参数，禁止 `label` 或短名（如 `operations`）
  - 默认必须回群，只有明确静默才允许不公告
- 在 `openclaw.json` 的群组 `-1003759411912` `systemPrompt` 中同步了以上约束，并重启 Gateway 生效。

### 验收观察

- `openclaw security audit --deep --json`：`critical=0, warn=1`（仅剩 `gateway.trusted_proxies_missing`）。
- `sessions_send` 已可触发，但在历史上下文较重的群会话中，仍会出现模型偏航：
  - 误用短名或 `label` 导致 `sessions.resolve` 失败；
  - 任务指令被旧上下文覆盖，输出与当前派单目标不一致；
  - 个别目标（如 `operations`）出现派单失败提示。

### 结论

- 架构链路已落地：`人 -> 入口 bot -> sessions_send 协作 -> 回群汇总`。
- 稳定性瓶颈不在配置开关，而在“群会话历史上下文污染 + 模型调用参数偏航”。

### 建议（下一步）

1. 在群里使用标准化派单模板（包含明确输出格式与完成标准）。
2. 尽量避免在同一会话里混入无关长对话；必要时切换到新的干净群线程/会话。
3. 若继续失败，进一步收紧提示词为“失败即停 + 不重试 + 强制返回错误原因”。

## 7. 备注

- 本文档仅记录问题，不自动改动配置。
- 文中敏感字段不做值展示，按“位置 + 类型”记录。
- 下一步可基于本文件生成“整改变更单 + 回归检查清单”。
- 已关联 P0 变更单: `openclaw-p0-remediation-change-order-2026-02-25.md`

## 8. 官方基线参考（审计对照）

- Gateway 单机模型:
  - https://docs.openclaw.ai/gateway/network-model#single-gateway-many-agents-and-channels
- 同机多网关约束:
  - https://docs.openclaw.ai/gateway#multiple-gateways-same-host
- 配置参考（策略与通道安全）:
  - https://docs.openclaw.ai/reference/config
- Security 指南:
  - https://docs.openclaw.ai/security
- CLI 文档:
  - https://docs.openclaw.ai/cli/gateway
  - https://docs.openclaw.ai/cli/doctor
  - https://docs.openclaw.ai/cli/channels
  - https://docs.openclaw.ai/cli/cron

## 9. 状态更新（2026-02-25）

- P0 项已执行完成，详见:
  - `openclaw-p0-remediation-change-order-2026-02-25.md`（第 9 节执行记录）
- 本次执行后验收摘要:
  - `openclaw security audit --deep --json` => `summary.critical = 0`
  - Telegram/Feishu 已配置账号仍为 `configured`
  - 核心群会话键仍可见（Telegram `-1003759411912`，Feishu `oc_7aa20ebe0c8cbc18faad3c7281fd5c56`）
