# OpenClaw 部署与供应商管理 Skill

## 核心规则（所有 agent 必须遵守）

### 默认模型
- **默认使用 Claude Opus 4.6**（`codesome/claude-opus-4-6-20250219`），除非用户明确指定其他模型
- 主供应商：**codesome**（`https://v3.codesome.cn`，API 类型 `anthropic-messages`）

### 供应商注册表

| 供应商 | baseUrl | API 类型 | 默认模型 | 状态 |
|--------|---------|----------|---------|------|
| **codesome** | `https://v3.codesome.cn` | `anthropic-messages` | `claude-opus-4-6-20250219` | ✅ 主力 |
| friend | `https://lldai.online/api/v1` | `openai-completions` | `claude-sonnet-4-5-20251022` | ⚠️ 易限流 |
| zhipu | `https://open.bigmodel.cn/api/paas/v4/` | `openai-completions` | `glm-5` | ⚠️ 余额问题 |
| kimi | `https://api.kimi.com/coding` | `openai-completions` | `kimi-for-coding` | ⚠️ 备用 |

### baseUrl 规则（关键！）
- `anthropic-messages` 类型自动拼接 `/v1/messages` → baseUrl **不带** `/v1`
- `openai-completions` 类型自动拼接 `/chat/completions` → baseUrl 按供应商要求配置

### API Key（统一引用，不要重复配置）
- codesome: `sk-0762c203c93d42c67d6b2ccb61a0a2d6064a90c056a327a2b4b25bbc09613b03`
- friend: `cr_56ad76b5fbb805f4f7b697fac3c68839e26c448e24672f91b2c163dccec98f01`
- zhipu: `147061d2996249ef97b60c094360999e.eTCWM5KrnQQsjvjb`
- kimi: `sk-kimi-4vA5ka7WNAFoK9kQ6eYQLDLhjEE5xbmIL3k0teckglBUKbCV52yK0XvsmMPcM7we`

## 多实例架构

| Profile | 端口 | 用途 | Telegram Bot |
|---------|------|------|-------------|
| main | 18789 | 主助手 | @DDbacklinkbot (default) |
| backlink | 19000 | 外链监控 | @DDbacklinkbot (default) |
| content | 19200 | 内容创作 | @DDawson2Bot (coding) |
| monitor | 19400 | 系统监控 | @DDawson1Bot (research) |

## 一键供应商管理

```bash
# 查看所有实例当前供应商
~/.openclaw/provider-switch.sh status

# 切换所有实例（API 挂了马上换）
~/.openclaw/provider-switch.sh switch codesome
~/.openclaw/provider-switch.sh switch friend

# 切换单个 profile
~/.openclaw/provider-switch.sh set main codesome/claude-opus-4-6-20250219
~/.openclaw/provider-switch.sh set content codesome/claude-sonnet-4-5-20251022

# 测试供应商连通性
~/.openclaw/provider-switch.sh test
~/.openclaw/provider-switch.sh test codesome
```

## 新实例部署模板

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "codesome": {
        "baseUrl": "https://v3.codesome.cn",
        "apiKey": "sk-0762c203c93d42c67d6b2ccb61a0a2d6064a90c056a327a2b4b25bbc09613b03",
        "api": "anthropic-messages",
        "models": [
          { "id": "claude-opus-4-6-20250219", "name": "Claude Opus 4.6", "contextWindow": 200000, "maxTokens": 8192 },
          { "id": "claude-sonnet-4-5-20251022", "name": "Claude Sonnet 4.5", "contextWindow": 200000, "maxTokens": 8192 }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "codesome/claude-opus-4-6-20250219" }
    }
  }
}
```

## 故障排查

### HTTP 404
1. 检查 baseUrl 是否与 API 类型路径重复（最常见）
2. `curl -X POST https://v3.codesome.cn/v1/messages` 直接测试
3. 查看 `~/.openclaw/logs/gateway.err.log`

### 网关频繁重启
1. 检查 `~/.openclaw/logs/guard.log` 是否有反复 bootout
2. guard.sh 已修复：进程存在时跳过，不再暴力重启
3. 检查 `gateway.log` 中的 SIGTERM 次数

### API 429 限流
1. `~/.openclaw/provider-switch.sh test` 测试所有供应商
2. `~/.openclaw/provider-switch.sh switch <可用供应商>` 一键切换

## 参考文件
- 供应商管理脚本：`~/.openclaw/provider-switch.sh`
- API 排查记录：`~/.openclaw/workspace/memory/openclaw-api-troubleshooting-2024-02-23.md`
- 多实例最佳实践：`~/.openclaw/workspace/memory/multi-instance-best-practices.md`
- 网关稳定性分析：`~/.openclaw/workspace/memory/openclaw-gateway-stability-analysis.md`
