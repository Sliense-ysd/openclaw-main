# API 配置技术笔记

记录 OpenClaw API 配置问题和解决方案。

## 2026-02-22: 朋友 API (lldai.online) 配置

### 问题
OpenClaw 使用朋友的 API 时出现 `HTTP 404` 或 `Connection error`。

### 原因
OpenClaw 的 `openai-completions` API 类型会自动在 baseUrl 后添加 `/chat/completions`。

### 解决方案
baseUrl 必须包含 `v1` 路径：

```json
{
  "friend": {
    "baseUrl": "https://lldai.online/api/v1",
    "apiKey": "cr_56ad76b5fbb805f4f7b697fac3c68839e26c448e24672f91b2c163dccec98f01",
    "api": "openai-completions",
    "models": [
      {
        "id": "claude-sonnet-4-5-20251022",
        "name": "Claude Sonnet 4.5",
        "contextWindow": 200000,
        "maxTokens": 8192
      }
    ]
  }
}
```

### 关键区别
| 错误配置 | 正确配置 |
|---------|---------|
| `https://lldai.online/api` | `https://lldai.online/api/v1` |

### 验证命令
```bash
curl -X POST "https://lldai.online/api/v1/chat/completions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5-20251022","messages":[{"role":"user","content":"hi"}],"max_tokens":50}'
```

### 当前可用模型
- `friend/claude-sonnet-4-5-20251022` ✅
- `zhipu/glm-5` ❌ (余额不足)
- `kimi/kimi-k2.5` ❌ (API Key 失效)

---

## 2026-02-22: Telegram 代理端口变更问题

### 现象
OpenClaw 网络"断了"，Telegram 频道同步失败，日志显示 `Network request failed`。

### 诊断步骤
1. 检查 API 连通性 - ✅ 正常
2. 检查代理端口 - ❌ 发现端口变更
3. 检查配置 - 确认 proxy 设置与实际端口不一致

### 原因
Clash/V2Ray 代理端口从 `7897` 变为 `7890`，但 OpenClaw 配置未同步更新。

### 解决方案
更新 `~/.openclaw/openclaw.json` 中的 Telegram 代理配置：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "proxy": "http://127.0.0.1:7890"
    }
  }
}
```

**必须重启 gateway 才能生效：**
```bash
killall openclaw-gateway
openclaw gateway &
```

### 预防措施
1. 代理软件更新时注意端口是否变更
2. 常用端口组合：7890(Clash)、7897(v2ray)、1080(Socks5)
3. 网络问题时优先检查：
   - API 连通性：`curl -X POST https://lldai.online/api/v1/chat/completions`
   - 代理端口：`nc -z 127.0.0.1 7890`
   - 日志：`tail -f /tmp/openclaw/openclaw-*.log`
