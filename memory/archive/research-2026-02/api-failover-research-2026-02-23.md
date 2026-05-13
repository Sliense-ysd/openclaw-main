# API Failover 和自愈系统研究 - 2026-02-23

## 研究目标
检查社区已有方案，避免从零开始构建可能有缺陷的解决方案。特别关注：
1. 重复重启风险
2. 冗余 Gateway 启动
3. OpenClaw 原生 Failover 支持
4. 社区最佳实践

---

## 🔍 核心发现

### 1. OpenClaw 原生支持多 Profile 和自动 Failover

#### ✅ 已内置功能（我们没用上）

**Auth Profiles 机制：**
```json
// ~/.openclaw/auth-profiles.json
{
  "profiles": {
    "anthropic:subscription": {
      "mode": "oauth",
      "email": "me@example.com"
    },
    "anthropic:api": {
      "mode": "api_key",
      "apiKey": "sk-ant-..."
    },
    "openrouter:key1": {
      "mode": "api_key",
      "apiKey": "sk-or-..."
    },
    "openrouter:key2": {
      "mode": "api_key",
      "apiKey": "sk-or-..."
    }
  },
  "order": {
    "anthropic": ["anthropic:subscription", "anthropic:api"],
    "openrouter": ["openrouter:key1", "openrouter:key2"]
  }
}
```

**关键特性：**
- 每个 provider 可以有多个 profile（不同的 API Key）
- `auth.order` 控制尝试顺序
- OpenClaw **自动轮换**到下一个 profile（遇到 auth/billing/rate-limit 错误时）
- 支持 round-robin 模式

**管理命令：**
```bash
openclaw models auth add           # 交互式添加 profile
openclaw models auth order           # 查看顺序
openclaw models auth order set anthropic anthropic:api anthropic:subscription
```

#### ✅ Model Failover 机制

```json
// openclaw.json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-5-20251022",
        "fallbacks": [
          "openrouter/anthropic/claude-sonnet-4-5-20251022",
          "minimax/MiniMax-M2.1"
        ]
      }
    }
  }
}
```

**工作原理：**
1. 主模型失败（auth/timeout）→ 尝试 fallbacks 列表中的下一个
2. 所有 profiles 都失败 → 切换到下一个 provider
3. **只对特定错误类型触发**：auth、billing、timeout、rate-limit
4. 不会在每次请求时切换（会话级缓存）

**⚠️ 重要限制（从 GitHub Issue #19249）：**
- Rate limit (429) **不会**触发 fallback
- 只有所有 profile 都失败后才切换到下一个 provider

### 2. 社区最佳实践

#### awesome-openclaw-usecases 发现

**自愈 Home Server 模式：**
- Reef 运行 15 个 cron jobs + 24 个自定义脚本
- 自动构建、部署、监控
- **关键经验**：
  - 使用多级防御：Guard 脚本 + LaunchAgent KeepAlive
  - 不要硬编码 API keys
  - 定期审计和轮换

**n8n 工作流编排：**
- OpenClaw 委托所有外部 API 交互给 n8n
- Agent 不直接接触凭证
- 可视化检查和锁定每个集成

**动态仪表板：**
- 并行数据抓取（API、数据库、社交媒体）
- 为每个数据源 spawn sub-agents
- 避免单个 agent 阻塞

#### OpenClaw Dashboard 社区项目

**已存在的监控方案：**
1. **tugcantopaloglu/openclaw-dashboard**
   - 实时监控 dashboard
   - Auth + TOTP MFA
   - 成本追踪
   - Live feed
   - Memory 浏览器
   - 零依赖

2. **adamevers/openclaw-dashboard**
   - Gateway 状态
   - Session 计数
   - 数据库连接
   - 响应式设计

3. **mudrii/openclaw-dashboard**
   - 零依赖命令中心
   - Gateway health
   - 成本、cron 状态
   - 活跃 sessions、sub-agent runs
   - 模型使用统计

### 3. 当前配置问题分析

#### ❌ 我们没用上的原生功能

**问题 1：手动硬编码 API Key**
```bash
# provider-switch.sh
PROVIDERS[codesome]='{"baseUrl":"...","apiKey":"sk-..."}'
```
- 所有 API Key 明文写在脚本里
- 没有使用 `auth-profiles.json`
- 无法利用原生轮换机制

**问题 2：没有配置 fallbacks**
```json
// 当前 openclaw.json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "zhipu-anthropic/claude-sonnet-4-5-20251022"
        // 缺少 fallbacks 字段！
      }
    }
  }
}
```

**问题 3：重复重启风险**

| 脚本 | 触发条件 | 操作 |
|------|----------|------|
| `auto-proxy.sh` | 代理端口变化（每 5 分钟） | 重启所有 4 个 Gateway |
| `guard.sh` | 进程不存在（每 30 秒） | 启动 Gateway |
| `openclaw-init.sh` | 开机执行 | 启动所有 Gateway |

**潜在冲突场景：**
1. auto-proxy 检测到端口变化 → 重启 Gateway
2. Guard 检测到进程消失（重启中）→ 尝试启动
3. 可能造成竞争条件

---

## 🎯 推荐方案

### 方案 A：使用 OpenClaw 原生 Auth Profiles（推荐）

**优势：**
- ✅ OpenClaw 内置，无需额外脚本
- ✅ 自动轮换到下一个 profile
- ✅ 支持多级 fallback（profile → model → provider）
- ✅ Session 级缓存，避免频繁切换
- ✅ 凭证安全存储在 `~/.openclaw/credentials/`

**实施步骤：**

1. **迁移 API Key 到 auth profiles**
```bash
# 为每个供应商创建多个 profile
openclaw models auth add
# 选择 provider: anthropic
# 输入 API key: sk-ant-...
# Profile name: anthropic:primary

openclaw models auth add
# Profile name: anthropic:backup
# 输入备用 key

openclaw models auth add
# Provider: openrouter
# Profile name: openrouter:key1
# ... 继续添加更多
```

2. **配置 auth order**
```bash
openclaw models auth order set anthropic anthropic:primary anthropic:backup
openclaw models auth order set openrouter openrouter:key1 openrouter:key2 openrouter:key3
```

3. **配置 model fallbacks**
```bash
openclaw models fallbacks add openrouter/anthropic/claude-sonnet-4-5-20251022
openclaw models fallbacks add minimax/MiniMax-M2.1
openclaw models fallbacks list
```

4. **清理旧脚本**
```bash
# 删除 provider-switch.sh 中的硬编码 keys
# 保留端口切换逻辑（改为 openclaw config set）
```

**监控：**
```bash
# 检查当前状态
openclaw models status

# 查看 auth profiles
openclaw models auth order

# 查看 fallbacks
openclaw models fallbacks list
```

### 方案 B：部署社区 Dashboard

**推荐项目：**
- **tugcantopaloglu/openclaw-dashboard** - 功能最全
- **adamevers/openclaw-dashboard** - 简洁实用

**部署：**
```bash
git clone https://github.com/tugcantopaloglu/openclaw-dashboard.git
cd openclaw-dashboard
npm install
npm start
```

**功能：**
- 实时 Gateway health
- API 使用追踪
- 成本统计
- Session 管理
- Memory 浏览器

**与原生机制配合：**
- Dashboard 只监控和展示
- 实际 failover 由 OpenClaw 内置机制处理

### 方案 C：最小化监控脚本（仅补充原生功能）

**如果需要额外功能，可以添加轻量级脚本：**

**api-health-check.sh**（每小时执行）
```bash
#!/bin/bash
# 只做一件事：检查并告警，不自动切换
LOG="$HOME/.openclaw/logs/api-health.log"

# 测试当前配置的 API
test_current_api() {
  # 发送一个最小的测试请求
  RESPONSE=$(curl -s -X POST "http://127.0.0.1:18789/agent/turn" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(cat ~/.openclaw/openclaw.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['gateway']['auth']['token'])")" \
    -d '{"message":"hi","sessionOptions":{"timeout":5000}}')

  # 检查响应中是否有 auth/429 错误
  if echo "$RESPONSE" | grep -q "auth.*error\|rate.*limit\|quota.*exceeded"; then
    echo "[$(date)] ⚠️ API Error detected: $RESPONSE" >> "$LOG"
    # 发送 Telegram 通知
    # 但不自动切换！让 OpenClaw 原生机制处理
  fi
}

test_current_api
```

**关键原则：**
- ✅ 只检查，不干预
- ✅ 让 OpenClaw 原生 failover 处理切换
- ✅ 避免与 guard.sh 冲突
- ✅ 避免与 auto-proxy.sh 冲突

---

## ⚠️ 需要避免的反模式

### 1. ❌ 不要手动实现轮换

```bash
# 错误示例（当前 provider-switch.sh）
if [ "$error" = "429" ]; then
  # 手动切换到下一个 provider
  switch_provider "moonshot"
fi
```

**问题：**
- 与 OpenClaw 原生机制冲突
- 可能造成不一致状态
- Session 缓存失效

### 2. ❌ 不要频繁重启 Gateway

```bash
# 错误示例
while true; do
  check_api_health
  if [ $? -ne 0 ]; then
    restart_gateway  # 频繁重启
  fi
  sleep 30
done
```

**问题：**
- 中断进行中的请求
- Session 状态丢失
- 与 KeepAlive 冲突

### 3. ❌ 不要硬编码 API Keys

```bash
# 错误示例
API_KEYS=("sk-aaa..." "sk-bbb..." "sk-ccc...")
```

**问题：**
- 安全风险
- 无法利用 auth profiles
- 无法动态轮换

---

## 📋 实施计划

### Phase 1：迁移到原生机制（立即）

1. [ ] 清理 `provider-switch.sh` 中的硬编码 keys
2. [ ] 为现有 5 个供应商创建 auth profiles
3. [ ] 配置 auth order
4. [ ] 配置 model fallbacks
5. [ ] 测试自动轮换

### Phase 2：部署监控（本周）

1. [ ] Clone openclaw-dashboard
2. [ ] 配置访问控制
3. [ ] 验证 Gateway health 监控
4. [ ] 验证成本追踪

### Phase 3：脚本清理（下周）

1. [ ] 简化 `auto-proxy.sh` - 只更新配置，不重启
2. [ ] 简化 `guard.sh` - 只监控进程，不干预 API
3. [ ] 移除重复的 Gateway 启动逻辑
4. [ ] 确保无竞争条件

---

## 📚 参考资料

### OpenClaw 官方文档
- [Model Failover](https://docs.openclaw.ai/concepts/model-failover)
- [Authentication](https://docs.openclaw.ai/gateway/authentication)
- [Models Commands](https://docs.openclaw.ai/cli/models)

### GitHub Issues
- [#8615](https://github.com/openclaw/openclaw/issues/8615) - Native multi-API-key support for OpenRouter
- [#19249](https://github.com/openclaw/openclaw/issues/19249) - Model failover does not activate on rate limit
- [#6880](https://github.com/openclaw/openclaw/issues/6880) - No graceful degradation when OpenAI billing is locked

### 社区项目
- [awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- [tugcantopaloglu/openclaw-dashboard](https://github.com/tugcantopaloglu/openclaw-dashboard)
- [adamevers/openclaw-dashboard](https://github.com/adamevers/openclaw-dashboard)

---

**研究完成时间**：2026-02-23
**下一步**：与主人讨论实施方案，确认后开始 Phase 1
