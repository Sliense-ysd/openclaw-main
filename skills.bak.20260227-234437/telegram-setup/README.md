# Telegram 配置完整指南

OpenClaw + Telegram Bot 完整配置流程，适用于 macOS/Linux 新机器部署。

## 一、创建 Telegram Bot

### 1.1 与 BotFather 对话
1. 在 Telegram 搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置：
   - Bot 显示名称（如：DDbacklink）
   - Bot 用户名（必须以 bot 结尾，如：DDbacklinkbot）

### 1.2 获取 Bot Token
BotFather 会返回类似信息：
```
Use this token to access the HTTP API:
8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk
```

**⚠️ 重要**：妥善保管 Token，不要分享给不信任的人。

## 二、获取 Chat ID

### 2.1 向 Bot 发送消息
1. 在 Telegram 搜索你的 Bot（如 `@DDbacklinkbot`）
2. 点击 START 或发送任意消息（如 `/start` 或 "hello"）

### 2.2 获取 Chat ID
访问以下 URL（替换你的 Bot Token）：
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

示例：
```
https://api.telegram.org/bot8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk/getUpdates
```

在返回的 JSON 中找到：
```json
{
  "chat": {
    "id": 7018683809,  // 这就是你的 Chat ID
    "first_name": "yang",
    "username": "seekoriginai"
  }
}
```

## 三、配置 OpenClaw

### 3.1 配置 Bot Token

**方法 1：使用配置命令**
```bash
openclaw configure --section channels
```
选择 Telegram，输入 Bot Token。

**方法 2：环境变量**
```bash
export TELEGRAM_BOT_TOKEN="8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk"
```

### 3.2 验证配置
```bash
openclaw status
```

查看 Channels 部分，应该显示：
```
Telegram │ ON │ OK │ token config (8520…Hndk · len 46) · accounts 1/1
```

### 3.3 重启 Gateway（如果需要）
```bash
openclaw gateway restart
```

## 四、配对用户

### 4.1 首次发送消息
用户首次给 Bot 发消息时，会收到配对提示：
```
OpenClaw: access not configured.
Your Telegram user id: 7018683809
Pairing code: NWCF425U
Ask the bot owner to approve with:
openclaw pairing approve telegram NWCF425U
```

### 4.2 批准用户
在服务器上运行：
```bash
openclaw pairing approve telegram NWCF425U
```

返回：
```
Approved telegram sender 7018683809.
```

### 4.3 测试对话
用户再次发送消息，Bot 应该正常回复。

## 五、测试消息发送

### 5.1 使用 curl 测试
```bash
curl -X POST "https://api.telegram.org/bot8520433288:AAGJ0LO_rDwffj7b_BXfweBbAKLIqWFHndk/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "7018683809", "text": "测试消息"}'
```

### 5.2 使用 OpenClaw message 工具
在 OpenClaw 中：
```
帮我给 telegram 发消息：测试成功！
```

## 六、常见问题

### 6.1 网络连接问题

**问题**：`Network request for 'sendMessage' failed!`

**原因**：无法访问 Telegram API（api.telegram.org）

**解决方案**：
1. 检查网络连接
2. 配置代理（如果在受限地区）：
```bash
export HTTP_PROXY="http://127.0.0.1:7897"
export HTTPS_PROXY="http://127.0.0.1:7897"
```

### 6.2 Bot 不回复消息

**问题**：用户发消息，Bot 没有反应

**原因**：
1. Bot Token 未配置
2. Gateway 未运行
3. 用户未配对

**解决方案**：
```bash
# 检查状态
openclaw status

# 检查 Gateway
openclaw gateway status

# 查看日志
openclaw logs --follow
```

### 6.3 配对码问题

**问题**：收到配对码但不知道如何批准

**解决方案**：
```bash
# 查看待批准的配对请求
openclaw pairing pending

# 批准指定配对码
openclaw pairing approve telegram <PAIRING_CODE>

# 批准所有待处理请求
openclaw pairing approve telegram --all
```

## 七、安全建议

1. **保护 Bot Token**
   - 不要提交到 Git 仓库
   - 使用环境变量或配置文件
   - 定期轮换 Token

2. **限制访问**
   - 只批准信任的用户
   - 定期检查配对列表
   - 使用白名单机制

3. **监控使用**
   - 定期查看日志
   - 监控异常请求
   - 设置使用限额

## 八、快速部署脚本

```bash
#!/bin/bash
# telegram-setup.sh - Telegram Bot 快速配置脚本

echo "=== Telegram Bot 配置向导 ==="

# 1. 输入 Bot Token
read -p "请输入 Bot Token: " BOT_TOKEN

# 2. 配置环境变量
export TELEGRAM_BOT_TOKEN="$BOT_TOKEN"

# 3. 配置 OpenClaw
openclaw configure --section channels

# 4. 重启 Gateway
openclaw gateway restart

# 5. 检查状态
openclaw status | grep -A 5 "Channels"

echo ""
echo "✅ 配置完成！"
echo ""
echo "下一步："
echo "1. 在 Telegram 中向 Bot 发送消息"
echo "2. 复制配对码"
echo "3. 运行: openclaw pairing approve telegram <PAIRING_CODE>"
```

## 九、验证清单

配置完成后，确认以下项目：

- [ ] Bot Token 已配置
- [ ] `openclaw status` 显示 Telegram 为 ON
- [ ] Gateway 正常运行
- [ ] 用户已配对
- [ ] 可以发送消息
- [ ] 可以接收消息
- [ ] 代理配置正确（如需要）

## 十、参考资料

- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [OpenClaw Telegram 文档](https://docs.openclaw.ai/channels/telegram)
- [OpenClaw 配置指南](https://docs.openclaw.ai/cli/configure)

---

**最后更新**：2026-02-22
**适用版本**：OpenClaw 2026.2.21-2+
