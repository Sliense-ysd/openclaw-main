# OpenClaw 完整部署指南

> 适用于新 Mac 的完整部署流程，避免踩坑。

## 一、前置准备

### 1. 安装 Node.js
```bash
brew install node
```

### 2. 确认代理软件
- Clash: 端口通常是 `7890`
- v2ray: 端口通常是 `7897` 或 `1080`
- 确认代理端口：`nc -z 127.0.0.1 <端口>`

## 二、安装 OpenClaw

```bash
npm install -g openclaw
```

验证安装：
```bash
openclaw --version
```

## 三、初始化配置

### 1. 运行初始化向导
```bash
openclaw configure
```

或者直接创建配置文件：
```bash
mkdir -p ~/.openclaw
```

### 2. 创建完整配置文件

创建 `~/.openclaw/openclaw.json`：

```json
{
  "meta": {
    "lastTouchedVersion": "2026.2.21-2",
    "lastTouchedAt": "2026-02-22T00:00:00.000Z"
  },
  "models": {
    "mode": "merge",
    "providers": {
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
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "friend/claude-sonnet-4-5-20251022"
      },
      "memorySearch": {
        "enabled": true,
        "provider": "local",
        "local": {
          "modelPath": "/Users/$USER/.openclaw/models/nomic-embed-text-v1.Q4_0.gguf"
        }
      },
      "compaction": {
        "mode": "safeguard"
      }
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "botToken": "8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk",
      "groupPolicy": "allowlist",
      "streaming": false,
      "proxy": "http://127.0.0.1:7890"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "<自动生成>"
    }
  },
  "plugins": {
    "entries": {
      "telegram": {
        "enabled": true
      }
    }
  }
}
```

## 四、关键配置要点

### 1. API BaseUrl 格式（重要！）
**必须包含 `/v1`**：
```json
"baseUrl": "https://lldai.online/api/v1"  ✅
"baseUrl": "https://lldai.online/api"      ❌
```

### 2. Telegram 代理配置
根据实际代理软件修改端口：
- Clash: `7890`
- v2ray: `7897` 或 `1080`

### 3. 模型配置
当前可用：
- `friend/claude-sonnet-4-5-20251022` ✅

备用（需充值/更新 API Key）：
- `zhipu/glm-5` - 智谱 AI
- `kimi/kimi-k2.5` - Moonshot

## 五、启动服务

### 1. 首次启动
```bash
# 创建必要目录
mkdir -p ~/.openclaw/{agents,models,memory,logs,credentials}

# 下载 embedding 模型（用于 memory）
# 会自动下载 nomic-embed-text-v1.Q4_0.gguf

# 启动 gateway
openclaw gateway
```

### 2. 后台运行
```bash
nohup openclaw gateway > /dev/null 2>&1 &
```

### 3. 验证状态
```bash
openclaw status
openclaw health
```

## 六、常用命令

```bash
# 启动 TUI 对话
openclaw tui

# 查看状态
openclaw status

# 查看日志
openclaw logs -f

# 重启 gateway
killall openclaw-gateway
openclaw gateway &

# 清除会话缓存
rm -rf ~/.openclaw/agents/main/sessions/*

# 重新索引 memory
openclaw memory index

# 运行诊断
openclaw doctor
```

## 七、故障排查

### 问题 1: Connection error
**检查**：
```bash
curl -X POST "https://lldai.online/api/v1/chat/completions" \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5-20251022","messages":[{"role":"user","content":"hi"}],"max_tokens":50}'
```

### 问题 2: Telegram 网络失败
**检查代理**：
```bash
nc -z 127.0.0.1 7890  # 检查端口是否开放
curl -x http://127.0.0.1:7890 -I https://api.telegram.org
```

### 问题 3: HTTP 404
**原因**：baseUrl 缺少 `/v1`
**解决**：修改为 `"baseUrl": "https://lldai.online/api/v1"`

### 问题 4: 401/403 认证失败
- 检查 API Key 是否过期
- 检查余额是否充足

## 八、文件位置

| 文件/目录 | 路径 |
|-----------|------|
| 主配置 | `~/.openclaw/openclaw.json` |
| 会话数据 | `~/.openclaw/agents/main/sessions/` |
| Memory 数据库 | `~/.openclaw/memory/main.sqlite` |
| Embedding 模型 | `~/.openclaw/models/nomic-embed-text-v1.Q4_0.gguf` |
| 日志 | `/tmp/openclaw/openclaw-YYYY-MM-DD.log` |
| 认证配置 | `~/.openclaw/agents/main/agent/auth.json` |

## 九、快速部署脚本

```bash
#!/bin/bash
# openclaw-setup.sh

echo "=== OpenClaw 快速部署 ==="

# 1. 安装
npm install -g openclaw

# 2. 创建目录
mkdir -p ~/.openclaw/{agents/main/{agent,sessions},models,memory,logs,credentials,workspace/memory}

# 3. 复制配置文件（需提前准备）
# cp openclaw.json ~/.openclaw/

# 4. 启动
echo "启动 gateway..."
nohup openclaw gateway > /dev/null 2>&1 &
sleep 3

# 5. 验证
openclaw status

echo "部署完成！运行 'openclaw tui' 开始对话"
```

## 十、注意事项

1. **首次启动必须重启**：修改配置后务必 `killall openclaw-gateway` 再启动
2. **代理端口会变**：Clash/v2ray 更新后检查端口
3. **会话缓存问题**：遇到奇怪错误时清除 `~/.openclaw/agents/main/sessions/`
4. **Memory 索引**：新增 memory 文件后运行 `openclaw memory index`
