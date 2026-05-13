# OpenClaw Gateway 频繁掉线问题分析与解决方案

## 问题概述

**现象**: MacBook 关闭屏幕/睡眠后，OpenClaw Gateway 停止运行，状态显示：
```
Gateway service │ LaunchAgent installed · not loaded · unknown
Gateway         │ unreachable (connect failed: connect ECONNREFUSED 127.0.0.1:18789)
```

## 根本原因分析

### 1. 系统层面
| 原因 | 说明 |
|------|------|
| **macOS 睡眠机制** | MacBook 睡眠时会暂停后台进程，即使使用 `caffeinate` 也只能防止空闲睡眠，无法阻止用户主动关闭屏幕导致的系统睡眠 |
| **LaunchAgent 限制** | `KeepAlive` 只在进程异常退出时有效，正常系统睡眠后的进程清理不会触发自动重启 |
| **SIGTERM 信号** | 系统在睡眠前会向进程发送 SIGTERM 信号，Gateway 正常关闭后不会自动重启 |

### 2. 日志证据
```
2026-02-23T01:31:27.338Z [gateway] signal SIGTERM received
2026-02-23T01:31:27.339Z [gateway] received SIGTERM; shutting down
```

### 3. 触发条件
- ✅ MacBook 关闭屏幕
- ✅ MacBook 进入睡眠（电池或电源）
- ✅ 用户手动锁定屏幕长时间不操作
- ❌ 仅使用 caffeinate 无法完全阻止

## 解决方案对比

| 方案 | 复杂度 | 可靠性 | 适用场景 |
|------|--------|--------|----------|
| **A. 保持 Mac 开机** | 低 | 中 | 短期使用 |
| **B. 使用 pmset 禁用睡眠** | 低 | 高 | 长期开机 |
| **C. 配置 KeepAlive + 定时检查** | 中 | 高 | 推荐方案 |
| **D. 使用 systemd (Linux)** | - | - | 不适用 macOS |

## 推荐方案：C - 多层防护

### 第 1 层：系统级防睡眠（pmset）
```bash
# 连接电源时永不睡眠
sudo pmset -c sleep 0
sudo pmset -c displaysleep 0
sudo pmset -c disksleep 0

# 验证
pmset -g | grep sleep
```

### 第 2 层：caffeinate 后台运行（已配置）
```bash
# ~/.openclaw/keep-awake.sh
exec caffeinate -dims
```

### 第 3 层：Gateway 监控脚本（新增）
创建自动检测和重启脚本：

```bash
#!/bin/bash
# ~/.openclaw/guard.sh - Gateway 守护脚本

LOG="$HOME/.openclaw/logs/guard.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# 检查 Gateway 是否运行
check_and_restart() {
    if ! curl -s http://127.0.0.1:18789/health > /dev/null 2>&1; then
        log "⚠️ Gateway 未响应，尝试重启..."
        openclaw gateway install --force >> "$LOG" 2>&1
        sleep 3
        if curl -s http://127.0.0.1:18789/health > /dev/null 2>&1; then
            log "✅ Gateway 重启成功"
        else
            log "❌ Gateway 重启失败"
        fi
    fi
}

log "🔍 Gateway 守护启动"
while true; do
    check_and_restart
    sleep 30  # 每 30 秒检查一次
done
```

### 第 4 层：Mac 唤醒后自动启动
创建 LaunchAgent 在唤醒时运行：

```xml
<!-- ~/Library/LaunchAgents/com.openclaw.wakeup.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openclaw.wakeup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>sleep 5 &amp;&amp; openclaw gateway install --force</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StartInterval</key>
    <integer>60</integer>
</dict>
</plist>
```

## 快速修复命令

当发现 Gateway 挂了时：

```bash
# 方法 1: 快速重启
openclaw gateway install --force

# 方法 2: 检查状态
openclaw status | grep Gateway

# 方法 3: 查看错误日志
tail -20 ~/.openclaw/logs/gateway.err.log
```

## 监控 Dashboard

创建状态监控脚本：

```bash
#!/bin/bash
# claw-health - 健康检查

echo "=== OpenClaw 健康检查 ==="
echo ""
echo "[Gateway]"
if openclaw status 2>/dev/null | grep -q "reachable"; then
    echo "  ✅ Gateway 运行正常"
else
    echo "  ❌ Gateway 未运行"
fi

echo ""
echo "[LaunchAgent]"
if launchctl list | grep -q "ai.openclaw.gateway"; then
    echo "  ✅ LaunchAgent 已加载"
else
    echo "  ❌ LaunchAgent 未加载"
fi

echo ""
echo "[caffeinate]"
if pgrep -x "caffeinate" > /dev/null; then
    echo "  ✅ caffeinate 正在运行 ($(pgrep -c caffeinate) 个进程)"
else
    echo "  ❌ caffeinate 未运行"
fi

echo ""
echo "[系统睡眠设置]"
pmset -g | grep -E "(sleep|disksleep|displaysleep)"
```

## 总结

**问题本质**: MacBook 睡眠会导致 Gateway 进程被优雅关闭，LaunchAgent 的 KeepAlive 无法在这种情况下自动重启。

**最佳实践**:
1. 开发/测试时使用 `claw-awake` 保持运行
2. 长期运行服务器使用 `sudo pmset -c sleep 0` 禁用睡眠
3. 配置监控脚本自动检测和重启
4. 定期检查 `openclaw status` 确保服务健康

---
**创建时间**: 2026-02-23
**相关文件**:
- `~/.openclaw/keep-awake.sh`
- `~/.openclaw/stop-awake.sh`
- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
