# OpenClaw API 问题诊断报告

## 问题时间线

**2026-02-23**
- 发现 API 报错 `HTTP 429: Total cost limit exceeded`
- 切换多个供应商均遇到问题

## 供应商状态检查

| 供应商 | 状态 | 错误 | 备注 |
|--------|------|------|------|
| **Kimi** (api.kimi.com/coding) | ❌ 404 | 模型 ID 不匹配 | 需用 `kimi-for-coding` |
| **GLM-5** (智谱) | ❌ 429 | 余额不足或 rate limit | 账户问题 |
| **Friend** (lldai) | ❌ 429 | Rate limit | 配额用完 |

## 关键发现

### 1. Claude Code vs OpenClaw 配置差异

**Claude Code 环境变量** (工作正常):
```bash
ANTHROPIC_BASE_URL=https://api.kimi.com/coding/
ANTHROPIC_API_KEY=sk-kimi-...
```

**OpenClaw 配置** (需要调整):
```json
{
  "baseUrl": "https://api.kimi.com/coding",  // 注意无尾斜杠
  "models": [{"id": "kimi-for-coding"}]      // 不是 kimi-k2.5
}
```

### 2. Cron 任务残留问题

旧的 cron 任务继续使用已失效的 API 配置，导致:
- 后台持续报错
- 污染 session 状态
- 影响新会话

**解决**: 删除所有 cron 任务后重建

### 3. 模型 ID 映射

| 供应商 | 显示名称 | 实际模型 ID |
|--------|----------|-------------|
| Kimi | Kimi K2.5 | `kimi-for-coding` |
| GLM | GLM-5 | `glm-5` |
| Friend | Claude Sonnet 4.5 | `claude-sonnet-4-5-20251022` |

## 解决方案

### 短期：修复当前配置

1. **确保使用正确的 baseUrl 和模型 ID**
2. **删除所有残留的 cron 任务**
3. **重启 Gateway**
4. **新建干净的终端会话**

### 长期：多供应商备份

建议配置至少 2-3 个供应商，自动 failover:
```json
{
  "models": {
    "mode": "fallback",  // 或 "merge"
    "providers": {
      "primary": { ... },
      "backup1": { ... },
      "backup2": { ... }
    }
  }
}
```

## 已更新的文档

- `~/.openclaw/workspace/skills/openclaw-setup/SKILL.md` - 添加 API 切换指南

## 下一步行动

1. [ ] 获取新的 API Key（OpenRouter / Together AI / DeepSeek）
2. [ ] 测试新供应商
3. [ ] 配置多供应商备份
4. [ ] 设置监控告警

---

## 2026-02-23: baseUrl 路径重复导致 404

### 问题
TUI 报错 `HTTP 404: 404 page not found`，网关连通但 API 调用失败。

### 根因
codesome provider 的 `baseUrl` 设为 `https://v3.codesome.cn/v1`，而 OpenClaw 的 `anthropic-messages` API 类型会自动拼接 `/v1/messages`，导致实际请求路径变成 `https://v3.codesome.cn/v1/v1/messages` → 404。

### 规则（所有 agent 必须遵守）
| API 类型 | 自动拼接路径 | baseUrl 示例 |
|----------|-------------|-------------|
| `anthropic-messages` | `/v1/messages` | `https://v3.codesome.cn`（不带 `/v1`）|
| `openai-completions` | `/v1/chat/completions` | `https://api.example.com`（不带 `/v1`）|

### 排查步骤
1. 检查 `~/.openclaw/logs/gateway.err.log` 是否有 "Config invalid" 错误
2. 用 `curl` 直接测试 API 端点确认端点本身是否正常
3. 检查 baseUrl + API 类型自动路径是否重复
4. 修改 `~/.openclaw/openclaw.json` 中的 baseUrl，网关会自动热重载

### 修复
将 `baseUrl` 从 `https://v3.codesome.cn/v1` 改为 `https://v3.codesome.cn`

---
**记录时间**: 2026-02-23
**状态**: 已解决
