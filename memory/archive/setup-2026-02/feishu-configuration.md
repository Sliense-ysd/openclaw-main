# 飞书配置指南

## 飞书发送外链消息配置

根据 OpenClaw 官方文档调研，飞书机器人发送外链消息的配置如下：

### 前置条件

1. **安装飞书插件**
   ```bash
   openclaw plugins install @openclaw/feishu
   ```

2. **创建飞书应用**
   - 访问 [飞书开放平台](https://open.feishu.cn/app)
   - 创建企业自建应用
   - 获取 App ID 和 App Secret

3. **配置应用权限**（批量导入以下 JSON）
   ```json
   {
     "scopes": {
       "tenant": [
         "im:message",
         "im:message:send_as_bot",
         "im:message.group_msg",
         "im:message.p2p_msg:readonly",
         "im:chat",
         "im:resource"
       ]
     }
   }
   ```

4. **启用机器人能力**
   - 在应用能力 > 机器人页面开启
   - 配置机器人名称

5. **配置事件订阅**
   - 选择"使用长连接接收事件"（WebSocket 模式）
   - 添加事件：`im.message.receive_v1`

### OpenClaw 配置

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "pairing",
      "groupPolicy": "open",
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "xxx",
          "botName": "我的AI助手"
        }
      }
    }
  },
  "plugins": {
    "entries": {
      "feishu": {
        "enabled": true
      }
    }
  }
}
```

### 发送外链消息

飞书机器人支持以下消息类型：

**发送能力**：
- ✅ 文本消息（包含 URL 链接）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ⚠️ 富文本（部分支持）

**发送外链的方式**：
1. **纯文本中包含链接**：直接在文本消息中包含 URL，飞书会自动识别并显示为可点击链接
2. **使用 message 工具**：通过 OpenClaw 的 message 工具发送消息到飞书

### 使用示例

```bash
# 通过 CLI 发送消息
openclaw message send --channel feishu --target <chat_id> --message "查看这个链接：https://example.com"
```

### 访问控制

**私聊策略**（dmPolicy）：
- `pairing`（默认）：未知用户需要配对码授权
- `allowlist`：仅白名单用户可对话
- `open`：允许所有人
- `disabled`：禁止私聊

**群组策略**（groupPolicy）：
- `open`（默认）：允许所有群组
- `allowlist`：仅白名单群组
- `disabled`：禁用群组消息

### 获取群组/用户 ID

**获取群组 ID（chat_id，格式 `oc_xxx`）**：
1. 启动网关并在群组中 @机器人发消息
2. 运行 `openclaw logs --follow` 查看日志中的 `chat_id`

**获取用户 ID（open_id，格式 `ou_xxx`）**：
1. 启动网关并给机器人发消息
2. 运行 `openclaw logs --follow` 查看日志中的 `open_id`

### 常用命令

```bash
# 查看网关状态
openclaw gateway status

# 重启网关
openclaw gateway restart

# 查看实时日志
openclaw logs --follow

# 查看配对请求
openclaw pairing list feishu

# 批准配对
openclaw pairing approve feishu <CODE>
```

### 注意事项

1. **WebSocket 模式**：飞书使用长连接模式，无需公网 IP 或域名
2. **消息限制**：
   - 文本分块大小：2000 字符（可配置 `textChunkLimit`）
   - 媒体大小限制：30MB（可配置 `mediaMaxMb`）
3. **流式输出**：飞书支持通过交互式卡片实现流式输出（默认启用）
4. **消息引用**：群聊中可以引用原消息（`replyToMode: "all"`）

### 参考资源

- [OpenClaw 飞书官方文档](https://docs.openclaw.ai/zh-CN/channels/feishu)
- [飞书开放平台](https://open.feishu.cn/app)
- [社区飞书插件](https://github.com/AlexAnys/openclaw-feishu)

---

**创建时间**: 2026-02-22 19:01
**最后更新**: 2026-02-22 19:01
