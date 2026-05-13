# Evomap: OpenClaw Gateway 稳定性问题

## 问题树

```
OpenClaw Gateway 频繁掉线
├── 触发条件
│   ├── MacBook 关闭屏幕
│   ├── MacBook 进入睡眠
│   ├── 长时间锁定屏幕
│   └── 系统更新/重启
│
├── 根本原因
│   ├── macOS 睡眠机制
│   │   └── 发送 SIGTERM 给所有进程
│   ├── LaunchAgent KeepAlive 限制
│   │   └── 只在异常退出时重启
│   └── caffeinate 无法阻止系统级睡眠
│
└── 解决方案（按优先级）
    ├── 方案 A: 禁用系统睡眠（推荐长期运行）
    │   ├── sudo pmset -c sleep 0
    │   ├── sudo pmset -c displaysleep 0
    │   └── 适用于: 24/7 运行的服务器
    │
    ├── 方案 B: 保持运行脚本（推荐日常使用）
    │   ├── caffeinate -dims
    │   ├── 定时检查重启脚本
    │   └── 适用于: 开发/测试环境
    │
    └── 方案 C: 唤醒后自动重启
        ├── LaunchAgent StartInterval
        ├── 系统唤醒钩子
        └── 适用于: 笔记本频繁开合场景
```

## 决策流程图

```
是否长期运行 OpenClaw?
│
├─ 是 ──→ 使用 pmset 禁用睡眠
│         sudo pmset -c sleep 0
│
└─ 否 ──→ 是否频繁开合笔记本?
          │
          ├─ 是 ──→ 配置唤醒自动重启
          │         + 定时检查脚本
          │
          └─ 否 ──→ 使用 caffeinate
                    claw-awake 命令
```

## 知识关联

```
OpenClaw Gateway 掉线
    ├── 相关配置
    │   ├── ~/.openclaw/openclaw.json
    │   ├── ~/Library/LaunchAgents/ai.openclaw.gateway.plist
    │   └── ~/.claude/projects/*/memory/ (当前对话)
    │
    ├── 相关命令
    │   ├── openclaw gateway install --force
    │   ├── openclaw status
    │   ├── pmset -g
    │   └── caffeinate
    │
    └── 相关技能
        ├── openclaw-setup (部署配置)
        ├── multi-instance-best-practices (多实例)
        └── 本文件 (稳定性分析)
```

## 解决方案对比矩阵

| 方案 | 睡眠防护 | 自动恢复 | 系统资源 | 配置复杂度 | 推荐度 |
|------|----------|----------|----------|------------|--------|
| pmset 禁用睡眠 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| caffeinate | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| 监控脚本 | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 唤醒钩子 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 实施检查清单

- [ ] 配置 `claw-awake` 快捷命令
- [ ] 设置 `sudo pmset -c sleep 0`（长期运行）
- [ ] 创建 `~/.openclaw/guard.sh` 监控脚本
- [ ] 配置 LaunchAgent 定时检查
- [ ] 添加到开机启动项
- [ ] 测试睡眠/唤醒后 Gateway 是否自动恢复

## 标签

#openclaw #gateway #stability #macos #sleep #launchagent #caffeinate #pmset #ops
