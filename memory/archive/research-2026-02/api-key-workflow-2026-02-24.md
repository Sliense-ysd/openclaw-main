# API Key 管理工作流程 - 2026-02-24

**更新时间**: 2026-02-24 10:31
**状态**: ✅ 已标准化

---

## 🎯 标准流程（所有情况）

### Step 1: 编辑源文件
```bash
vim ~/.openclaw/agents/main/agent/models.json
```

**可以修改**：
- API Key（`apiKey`）
- Base URL（`baseUrl`）
- 添加/删除供应商（`providers`）

---

### Step 2: 运行同步脚本
```bash
~/.openclaw/sync-auth.sh --restart
```

**这个脚本会**：
1. 同步 `models.json` 到所有 Agent 的 `auth-profiles.json`
2. 重启 Gateway
3. 一次性完成所有更新

---

## 🎯 特殊情况（Claude Code）

**如果修改影响 Claude Code**（即环境变量 `ANTHROPIC_BASE_URL` 或 `ANTHROPIC_API_KEY`）：

**额外步骤**：
```bash
# 更新 ~/.zshrc
vim ~/.zshrc

# 重启终端
source ~/.zshrc
# 或者关闭并重新打开终端
```

---

## 🔧 快速诊断

**如果出现问题**：
```
在 Claude Code 中输入：/fix-api
```

**这个命令会**：
1. 运行同步脚本
2. 检查 Gateway 状态
3. 验证环境变量
4. 报告发现的问题

---

## 🚫 不再需要手动操作

- ❌ 手动编辑 `auth-profiles.json`
- ❌ 手动复制文件到其他 Agent 目录
- ❌ 手动重启 Gateway
- ❌ 手动验证配置

---

## 📋 完整示例

### 示例 1: 更新 API Key

```bash
# Step 1: 编辑 models.json
vim ~/.openclaw/agents/main/agent/models.json

# 修改 apiKey
# "key": "新的-API-Key-123"

# Step 2: 运行同步
~/.openclaw/sync-auth.sh --restart
```

---

### 示例 2: 更新 Base URL

```bash
# Step 1: 编辑 models.json
vim ~/.openclaw/agents/main/agent/models.json

# 修改 baseUrl
# "base_url": "https://新的-endpoint.com"

# Step 2: 运行同步
~/.openclaw/sync-auth.sh --restart
```

---

### 示例 3: 添加新供应商

```bash
# Step 1: 编辑 models.json
vim ~/.openclaw/agents/main/agent/models.json

# 在 providers 中添加新供应商
{
  "newprovider": {
    "baseUrl": "https://api.newprovider.com",
    "apiKey": "sk-new-api-key",
    "api": "anthropic-messages",
    "models": [...]
  }
}

# Step 2: 运行同步
~/.openclaw/sync-auth.sh --restart
```

---

### 示例 4: 删除供应商

```bash
# Step 1: 编辑 models.json
vim ~/.openclaw/agents/main/agent/models.json

# 删除整个 provider 块

# Step 2: 运行同步
~/.openclaw/sync-auth.sh --restart
```

---

## 📋 下次切换 API Key 的标准短语

### 选项 1: 标准描述
```
切换 API Key：编辑 ~/.openclaw/agents/main/agent/models.json，运行 ~/.openclaw/sync-auth.sh --restart
```

### 选项 2: 简化描述
```
更新 API：编辑 models.json，运行 sync-auth.sh --restart
```

### 选项 3: 快速诊断（如果出错）
```
修复 API：运行 /fix-api
```

---

## 🎯 关键要点

1. **源文件**: `~/.openclaw/agents/main/agent/models.json`
2. **同步脚本**: `~/.openclaw/sync-auth.sh --restart`
3. **诊断命令**: `/fix-api`
4. **不再手动操作**: `auth-profiles.json`

---

**更新记录**:
- 2026-02-24: 创建标准工作流程，简化 API Key 管理
