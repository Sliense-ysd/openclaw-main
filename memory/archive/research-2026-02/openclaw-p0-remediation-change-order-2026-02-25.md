# OpenClaw P0 整改变更单（2026-02-25）

## 1. 变更单信息

- 变更单编号: `CHG-OC-P0-20260225`
- 来源文档: `openclaw-usage-compliance-audit-2026-02-25.md`
- 目标: 消除当前 `Critical` 级安全差异，且不改变既有 agent 路由结构
- 影响范围: `~/.openclaw/openclaw.json`（配置变更）+ `gateway` 重载

## 2. 通过标准（验收门槛）

- 门槛 A: `openclaw security audit --deep --json` 中 `summary.critical == 0`
- 门槛 B: `openclaw channels list` 仍显示当前已配置账号为 `configured`
- 门槛 C: `openclaw status --json` 中既有核心会话键仍可见（主群组不丢失）

## 3. 变更前基线（本次审计确认）

- Telegram 现状:
  - 顶层 `groupPolicy = open`
  - 多账号 `allowFrom = ["*"]`
  - 审计提示 `Telegram group commands have no sender allowlist`
- Feishu 现状:
  - 顶层 `groupPolicy = open`
  - 多账号 `allowFrom = ["*"]`
- 当前已观测在用群组:
  - Telegram: `-1003759411912`
  - Feishu: `oc_7aa20ebe0c8cbc18faad3c7281fd5c56`

## 4. P0 变更项

### P0-01 收敛群策略为 allowlist（必须）

- 变更目标:
  - `channels.telegram.groupPolicy: open -> allowlist`
  - `channels.feishu.groupPolicy: open -> allowlist`
  - 所有已配置账号 `groupPolicy` 统一为 `allowlist`
- 说明:
  - 这是消除“开放群 + 高权限工具暴露”Critical 的核心动作。

### P0-02 建立群白名单（必须）

- 变更目标:
  - Telegram 群白名单加入 `-1003759411912`
  - Feishu 群白名单加入 `oc_7aa20ebe0c8cbc18faad3c7281fd5c56`
- 说明:
  - 不建议只改 `groupPolicy` 而不落白名单，否则会把现有群流量全部拦截。

### P0-03 建立 Telegram 群发送者白名单（必须）

- 变更目标:
  - 设置 `channels.telegram.groupAllowFrom`
  - 首批可用值建议包含现有已知 owner id: `7018683809`
- 说明:
  - 当前审计明确给出 `groups.allowFrom.missing` 为 Critical。
  - 若有多个管理员，需在切换前补齐所有管理员 user id。

### P0-04 移除账号级 `allowFrom=["*"]`（必须）

- 变更目标:
  - Telegram/Feishu 各账号中显式 `allowFrom=["*"]` 全部移除或收敛为明确列表
- 说明:
  - 账号级星号放开与 P0 安全目标冲突。

## 5. 实施步骤（执行顺序）

### Step 1 备份配置

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak.p0.$(date +%Y%m%d%H%M%S)
```

### Step 2 执行配置改动

建议方式:

1. 使用 `openclaw configure --section channels` 交互方式修改策略与白名单。
2. 若使用手工编辑，必须完成以下检查项:
   - Telegram/Feishu 顶层与账号层 `groupPolicy` 均为 `allowlist`
   - Telegram/Feishu 群白名单已录入在用群
   - Telegram `groupAllowFrom` 已填入管理员 user id（至少 `7018683809`）
   - 移除所有 `allowFrom=["*"]`

### Step 3 配置体检

```bash
openclaw doctor --non-interactive
```

若 doctor 报配置错误，先修复再继续，不要带错配置重启。

### Step 4 重载网关

```bash
openclaw gateway restart
```

### Step 5 验收

```bash
openclaw security audit --deep --json
openclaw channels list
openclaw status --json
```

## 6. 回滚方案

### 回滚触发条件

- 关键群消息全部被拦截
- 审计出现新的严重配置错误
- Gateway 启动失败

### 回滚步骤

```bash
cp ~/.openclaw/openclaw.json.bak.p0.<timestamp> ~/.openclaw/openclaw.json
openclaw doctor --non-interactive
openclaw gateway restart
```

## 7. 执行注意事项

- 本次 P0 只做“访问面收敛”，不调整现有 agent/bindings 结构。
- `logistics/social` 仍是未配置账号（token=none），不在本次 P0 处理范围内。
- 若 Feishu 管理员 open_id 尚未整理，可先完成 P0-01/P0-02/P0-04，再在 24 小时内补齐 Feishu 发送者白名单。

## 8. 变更后建议（非 P0）

- P1: 收敛外部渠道可用工具面（sandbox/runtime/fs 最小权限）
- P1: 清理重复启动链路（wrapper + service 叠加）
- P1: 修复 Cron 投递链路与账号/路由不一致问题

## 9. 执行记录（已实施）

- 执行时间: `2026-02-25 16:05:42 CST`
- 执行人: Codex（按本变更单实施）
- 配置备份:
  - `~/.openclaw/openclaw.json.bak.p0.20260225155447`

### 9.1 已落地配置

- Telegram:
  - 顶层与账号层 `groupPolicy` 全部收敛为 `allowlist`
  - 新增群白名单: `channels.telegram.groups["-1003759411912"]`
  - 新增群发送者白名单: `channels.telegram.groupAllowFrom=["7018683809"]`
  - 清理账号级 `allowFrom=["*"]`
- Feishu:
  - 顶层与账号层 `groupPolicy` 全部收敛为 `allowlist`
  - 新增群白名单: `channels.feishu.groups["oc_7aa20ebe0c8cbc18faad3c7281fd5c56"]`
  - 新增群发送者白名单: `channels.feishu.groupAllowFrom=[7 个 open_id（由网关日志“received message from”提取）]`
  - 清理顶层/账号级 `allowFrom=["*"]`

### 9.2 兼容性调整（为保证校验通过）

- 将 Telegram/Feishu 中原本 `dmPolicy="open"` 的账号收敛为 `dmPolicy="pairing"`，避免与移除 `allowFrom=["*"]` 后的校验冲突。

### 9.3 验收结果

- `openclaw doctor --non-interactive`: 通过（无配置错误）
- `openclaw gateway restart`: 成功（LaunchAgent 已重载）
- `openclaw security audit --deep --json`:
  - `summary.critical: 0`（满足门槛 A）
  - `summary.warn: 2`（剩余为 `trusted_proxies` 与本机 `EPERM probe`）
- `openclaw channels list`:
  - Telegram/Feishu 已配置账号均为 `configured`（满足门槛 B）
- `openclaw status --json`:
  - 既有核心会话键仍可见（`telegram:-1003759411912` 与 `feishu:oc_7aa20ebe0c8cbc18faad3c7281fd5c56`）（满足门槛 C）
