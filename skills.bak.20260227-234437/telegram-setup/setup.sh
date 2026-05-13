#!/bin/bash
# telegram-setup.sh - Telegram Bot 快速配置脚本

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   Telegram Bot 配置向导                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 检查 OpenClaw 是否安装
if ! command -v openclaw &> /dev/null; then
    echo "❌ OpenClaw 未安装"
    echo "请先安装 OpenClaw: https://docs.openclaw.ai/install"
    exit 1
fi

echo "✅ OpenClaw 已安装"
echo ""

# 1. 输入 Bot Token
echo "步骤 1/5: 配置 Bot Token"
echo "----------------------------------------"
echo "请访问 @BotFather 创建 Bot 并获取 Token"
echo ""
read -p "请输入 Bot Token: " BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Bot Token 不能为空"
    exit 1
fi

# 2. 配置环境变量
echo ""
echo "步骤 2/5: 配置环境变量"
echo "----------------------------------------"
export TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
echo "✅ 环境变量已设置"

# 3. 测试 Bot Token
echo ""
echo "步骤 3/5: 测试 Bot Token"
echo "----------------------------------------"
RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
if echo "$RESPONSE" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Bot Token 有效"
    echo "   Bot 用户名: @${BOT_USERNAME}"
else
    echo "❌ Bot Token 无效"
    echo "$RESPONSE"
    exit 1
fi

# 4. 配置 OpenClaw
echo ""
echo "步骤 4/5: 配置 OpenClaw"
echo "----------------------------------------"
echo "正在配置 Telegram 渠道..."

# 写入配置（需要手动运行 openclaw configure）
echo ""
echo "⚠️  请手动运行以下命令完成配置："
echo ""
echo "  openclaw configure --section channels"
echo ""
echo "然后选择 Telegram，输入 Bot Token。"
echo ""
read -p "配置完成后按 Enter 继续..."

# 5. 重启 Gateway
echo ""
echo "步骤 5/5: 重启 Gateway"
echo "----------------------------------------"
openclaw gateway restart
echo "✅ Gateway 已重启"

# 检查状态
echo ""
echo "检查配置状态..."
echo "----------------------------------------"
openclaw status | grep -A 5 "Channels" || true

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   ✅ 配置完成！                            ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "下一步："
echo "1. 在 Telegram 中搜索 @${BOT_USERNAME}"
echo "2. 发送任意消息（如 /start）"
echo "3. 复制配对码"
echo "4. 运行: openclaw pairing approve telegram <PAIRING_CODE>"
echo ""
echo "测试消息发送："
echo "  bash test-telegram.sh <CHAT_ID>"
echo ""
