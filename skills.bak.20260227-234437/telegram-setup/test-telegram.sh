#!/bin/bash
# test-telegram.sh - 测试 Telegram Bot 消息发送

if [ -z "$1" ]; then
    echo "用法: bash test-telegram.sh <CHAT_ID>"
    echo ""
    echo "获取 Chat ID："
    echo "1. 向 Bot 发送消息"
    echo "2. 访问: https://api.telegram.org/bot<BOT_TOKEN>/getUpdates"
    echo "3. 在返回的 JSON 中找到 chat.id"
    exit 1
fi

CHAT_ID=$1

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ 环境变量 TELEGRAM_BOT_TOKEN 未设置"
    echo ""
    echo "请运行: export TELEGRAM_BOT_TOKEN=\"your_bot_token\""
    exit 1
fi

echo "测试 Telegram Bot 消息发送..."
echo "----------------------------------------"
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}...${TELEGRAM_BOT_TOKEN: -10}"
echo "Chat ID: $CHAT_ID"
echo ""

# 发送测试消息
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"$CHAT_ID\", \"text\": \"🎉 测试消息：Telegram Bot 配置成功！\\n\\n时间：$(date)\"}")

# 检查结果
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ 消息发送成功！"
    echo ""
    echo "返回信息："
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ 消息发送失败"
    echo ""
    echo "错误信息："
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
