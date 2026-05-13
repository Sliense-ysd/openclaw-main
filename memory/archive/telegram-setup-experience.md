# Telegram 配置经验总结

## 配置过程回顾

### 遇到的问题

1. **网络连接超时**
   - 问题：`curl: (28) SSL connection timeout`
   - 原因：无法直接访问 `api.telegram.org`
   - 解决：确认代理配置正确（127.0.0.1:7897）

2. **message 工具失败**
   - 问题：`Network request for 'sendMessage' failed!`
   - 原因：Bot Token 未正确配置到 OpenClaw
   - 解决：使用 `openclaw configure --section channels` 配置

3. **用户配对问题**
   - 问题：Bot 收到消息但不回复
   - 原因：用户未配对，需要批准
   - 解决：`openclaw pairing approve telegram <PAIRING_CODE>`

### 成功的配置流程

1. **创建 Bot**（@BotFather）
   - `/newbot` → 设置名称和用户名
   - 获取 Bot Token

2. **获取 Chat ID**
   - 向 Bot 发送消息
   - 访问 `getUpdates` API
   - 提取 `chat.id`

3. **配置 OpenClaw**
   - `openclaw configure --section channels`
   - 选择 Telegram，输入 Token
   - 重启 Gateway

4. **配对用户**
   - 用户发送消息
   - 复制配对码
   - `openclaw pairing approve telegram <CODE>`

5. **测试**
   - 使用 curl 测试发送
   - 使用 message 工具测试
   - 用户对话测试

## 关键命令

```bash
# 配置 Telegram
openclaw configure --section channels

# 检查状态
openclaw status | grep -A 5 "Channels"

# 重启 Gateway
openclaw gateway restart

# 查看待配对请求
openclaw pairing pending

# 批准配对
openclaw pairing approve telegram <PAIRING_CODE>

# 测试发送消息
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<CHAT_ID>", "text": "测试"}'
```

## 注意事项

1. **代理配置**
   - 如果在受限地区，必须配置代理
   - 环境变量：`HTTP_PROXY` / `HTTPS_PROXY`

2. **Token 安全**
   - 不要提交到 Git
   - 使用环境变量或配置文件
   - 定期轮换

3. **用户管理**
   - 首次使用需要配对
   - 定期检查配对列表
   - 及时撤销不需要的访问

4. **调试技巧**
   - 使用 `openclaw logs --follow` 查看实时日志
   - 使用 curl 直接测试 Telegram API
   - 检查 Gateway 状态

## 部署清单

新机器部署 Telegram Bot 时的检查清单：

- [ ] OpenClaw 已安装
- [ ] 创建 Telegram Bot（@BotFather）
- [ ] 获取 Bot Token
- [ ] 配置 OpenClaw Telegram 渠道
- [ ] 重启 Gateway
- [ ] 测试消息发送（curl）
- [ ] 用户发送消息获取配对码
- [ ] 批准用户配对
- [ ] 测试双向通信
- [ ] 配置代理（如需要）
- [ ] 验证所有功能正常

## 故障排查

### Bot 不回复消息

1. 检查 Gateway 状态：`openclaw gateway status`
2. 查看日志：`openclaw logs --follow`
3. 确认用户已配对：`openclaw pairing pending`
4. 测试 Bot Token：`curl https://api.telegram.org/bot<TOKEN>/getMe`

### 消息发送失败

1. 检查网络连接
2. 确认代理配置
3. 验证 Chat ID 正确
4. 测试 Telegram API 可达性

### 配对失败

1. 确认 Bot Token 正确
2. 检查 Gateway 运行状态
3. 查看配对请求列表
4. 手动批准配对码

---

**创建时间**：2026-02-22
**适用场景**：macOS/Linux 新机器部署
**测试环境**：macOS 14.5, OpenClaw 2026.2.21-2
