# OpenClaw 多实例部署最佳方案

## 调研总结

根据官方文档和社区最佳实践，OpenClaw 支持多实例运行，主要有两种架构：

### 架构 A：单 Gateway + 多 Agent（推荐用于相关任务）
- 一个 Gateway 管理多个 Agent
- 共享基础设施，独立 workspace
- 适合：同一项目的不同角色（协调者、开发者、内容创作者）

### 架构 B：多 Gateway + 完全隔离（推荐用于完全独立任务）
- 每个 Gateway 完全独立
- 独立配置、端口、workspace、memory
- 适合：完全不同的项目/客户/任务

## 你的需求分析

根据你的描述：
- "互不打扰"
- "负责的内容完全不同"
- "独立的"

**推荐：架构 B - 多 Gateway 完全隔离**

---

## 最佳方案设计

### 方案：使用 Profile 实现完全隔离

OpenClaw 官方推荐使用 `--profile` 参数，自动隔离所有资源。

### 目录结构

```
~/.openclaw/              # 主实例（默认）
├── agents/
├── workspace/
│   ├── skills/
│   └── memory/
├── credentials/
├── cron/
└── openclaw.json

~/.openclaw-backlink/     # 外链实例
├── agents/
├── workspace/
│   ├── skills/
│   │   ├── semrush-monitor/
│   │   ├── competitor-backlinks/
│   │   └── backlink-submission/
│   └── memory/
│       └── backlink-operations.md
├── credentials/
├── cron/
└── openclaw.json

~/.openclaw-content/      # 内容创作实例
├── agents/
├── workspace/
│   ├── skills/
│   │   ├── article-writer/
│   │   └── seo-optimizer/
│   └── memory/
│       └── content-strategy.md
├── credentials/
├── cron/
└── openclaw.json

~/.openclaw-monitor/      # 监控实例
├── agents/
├── workspace/
│   ├── skills/
│   │   └── system-monitor/
│   └── memory/
│       └── alerts.md
├── credentials/
├── cron/
└── openclaw.json
```

### 端口分配规则

**重要**：每个实例的端口至少间隔 20+，避免衍生端口冲突。

| 实例 | Gateway 端口 | Browser 端口 | Canvas 端口 | 用途 |
|------|-------------|-------------|------------|------|
| main | 18789 | 18791 | 18789 | 主实例/通用 |
| backlink | 19000 | 19002 | 19000 | 外链监控和提交 |
| content | 19200 | 19202 | 19200 | 内容创作 |
| monitor | 19400 | 19402 | 19400 | 系统监控 |

### 配置隔离清单

每个实例必须独立配置：

✅ **自动隔离**（使用 `--profile` 自动处理）：
- `OPENCLAW_CONFIG_PATH` - 配置文件
- `OPENCLAW_STATE_DIR` - 状态目录
- `agents.defaults.workspace` - workspace 路径
- Service 名称（自动添加后缀）

✅ **手动配置**（需要明确指定）：
- `gateway.port` - Gateway 端口
- Telegram Bot Token（不同实例用不同 Bot）
- API Keys（可共享或独立）
- Cron 任务（独立调度）

---

## 实施步骤

### 1. 创建实例管理脚本

```bash
#!/bin/bash
# ~/openclaw-fleet.sh - 多实例管理脚本

INSTANCES=(
  "main:18789:主实例"
  "backlink:19000:外链监控"
  "content:19200:内容创作"
  "monitor:19400:系统监控"
)

case "$1" in
  setup)
    PROFILE=$2
    PORT=$3
    if [ -z "$PROFILE" ] || [ -z "$PORT" ]; then
      echo "用法: $0 setup <profile> <port>"
      exit 1
    fi
    echo "设置实例: $PROFILE (端口: $PORT)"
    openclaw --profile $PROFILE configure
    ;;
    
  start)
    PROFILE=$2
    if [ -z "$PROFILE" ]; then
      echo "启动所有实例..."
      for instance in "${INSTANCES[@]}"; do
        IFS=':' read -r profile port desc <<< "$instance"
        echo "启动 $desc ($profile)..."
        openclaw --profile $profile gateway start
      done
    else
      echo "启动实例: $PROFILE"
      openclaw --profile $PROFILE gateway start
    fi
    ;;
    
  stop)
    PROFILE=$2
    if [ -z "$PROFILE" ]; then
      echo "停止所有实例..."
      pkill -f openclaw-gateway
    else
      echo "停止实例: $PROFILE"
      openclaw --profile $PROFILE gateway stop
    fi
    ;;
    
  status)
    echo "实例状态："
    echo "----------------------------------------"
    for instance in "${INSTANCES[@]}"; do
      IFS=':' read -r profile port desc <<< "$instance"
      echo ""
      echo "[$desc - $profile]"
      openclaw --profile $profile status 2>/dev/null | grep -E "(Gateway|Agents|Channels)" || echo "  未运行"
    done
    ;;
    
  list)
    echo "已配置的实例："
    echo "----------------------------------------"
    for instance in "${INSTANCES[@]}"; do
      IFS=':' read -r profile port desc <<< "$instance"
      printf "%-15s %-10s %s\n" "$profile" "端口:$port" "$desc"
    done
    ;;
    
  *)
    echo "OpenClaw 多实例管理"
    echo ""
    echo "用法: $0 {setup|start|stop|status|list} [profile]"
    echo ""
    echo "命令："
    echo "  setup <profile> <port>  - 初始化新实例"
    echo "  start [profile]         - 启动实例（不指定则启动全部）"
    echo "  stop [profile]          - 停止实例（不指定则停止全部）"
    echo "  status                  - 查看所有实例状态"
    echo "  list                    - 列出已配置的实例"
    echo ""
    echo "示例："
    echo "  $0 setup backlink 19000"
    echo "  $0 start backlink"
    echo "  $0 status"
    ;;
esac
```

### 2. 初始化实例

```bash
# 给脚本添加执行权限
chmod +x ~/openclaw-fleet.sh

# 初始化外链实例
~/openclaw-fleet.sh setup backlink 19000
# 按提示配置：
# - Gateway 端口：19000
# - Workspace：~/.openclaw-backlink/workspace
# - Telegram Bot（创建新的 Bot）

# 初始化内容实例
~/openclaw-fleet.sh setup content 19200

# 初始化监控实例
~/openclaw-fleet.sh setup monitor 19400
```

### 3. 迁移 Skills 和 Memory

```bash
# 外链实例 - 迁移相关 skills
mkdir -p ~/.openclaw-backlink/workspace/skills
cp -r ~/.openclaw/workspace/skills/semrush-monitor ~/.openclaw-backlink/workspace/skills/
cp -r ~/.openclaw/workspace/skills/competitor-backlinks ~/.openclaw-backlink/workspace/skills/
cp -r ~/.openclaw/workspace/skills/backlink-submission ~/.openclaw-backlink/workspace/skills/

# 创建独立 memory
mkdir -p ~/.openclaw-backlink/workspace/memory
cat > ~/.openclaw-backlink/workspace/memory/MEMORY.md << 'EOF'
# 外链监控与提交系统

## 职责
- 每日外链收录检查
- 竞品外链扫描
- 外链批量提交

## 数据源
- Semrush (sem.3ue.com)
- 飞书 Bitable

## 定时任务
- 10:00 - 外链收录检查
- 08:00 - 竞品外链扫描
EOF
```

### 4. 配置独立的 Telegram Bot

每个实例使用不同的 Telegram Bot：

```bash
# 外链实例
openclaw --profile backlink configure --section channels
# 输入新的 Bot Token（从 @BotFather 创建）

# 内容实例
openclaw --profile content configure --section channels
# 输入另一个 Bot Token
```

### 5. 启动和管理

```bash
# 查看所有实例
~/openclaw-fleet.sh list

# 启动特定实例
~/openclaw-fleet.sh start backlink

# 启动所有实例
~/openclaw-fleet.sh start

# 查看状态
~/openclaw-fleet.sh status

# 停止特定实例
~/openclaw-fleet.sh stop backlink
```

---

## 优势分析

### ✅ 完全隔离
- 独立配置文件
- 独立 workspace
- 独立 skills 和 memory
- 独立 Telegram Bot
- 独立端口和服务

### ✅ 易于管理
- 统一的管理脚本
- 清晰的实例命名
- 独立的日志和状态

### ✅ 资源优化
- 按需启动/停止
- 独立的资源限制
- 互不影响的运行

### ✅ 扩展性强
- 轻松添加新实例
- 独立升级和维护
- 灵活的配置调整

---

## 实例使用场景示例

### 外链实例 (backlink)
```bash
# 手动触发外链收录检查
openclaw --profile backlink agent "执行每日外链收录检查"

# 查看外链实例日志
openclaw --profile backlink logs --follow

# 外链实例状态
openclaw --profile backlink status
```

### 内容实例 (content)
```bash
# 生成文章
openclaw --profile content agent "写一篇关于 AI 的文章"

# 查看内容实例的 memory
cat ~/.openclaw-content/workspace/memory/MEMORY.md
```

### 监控实例 (monitor)
```bash
# 系统健康检查
openclaw --profile monitor agent "检查系统状态并报告"
```

---

## 注意事项

### 1. 端口冲突
- 确保端口间隔至少 20
- 检查防火墙规则
- 避免与其他服务冲突

### 2. 资源管理
- 监控 CPU 和内存使用
- 合理分配实例数量
- 考虑使用 systemd 管理服务

### 3. 备份策略
```bash
# 备份所有实例配置
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw* \
  ~/openclaw-fleet.sh
```

### 4. 日志管理
```bash
# 定期清理日志
find ~/.openclaw*/logs -name "*.log" -mtime +30 -delete
```

---

## 与其他方案对比

| 方案 | 隔离程度 | 管理复杂度 | 资源开销 | 推荐度 |
|------|---------|-----------|---------|--------|
| 单 Gateway + 多 Agent | 中 | 低 | 低 | ⭐⭐⭐ 相关任务 |
| Profile 多实例 | 高 | 中 | 中 | ⭐⭐⭐⭐⭐ 独立任务 |
| Docker 容器 | 最高 | 高 | 高 | ⭐⭐⭐⭐ 生产环境 |
| 多用户账户 | 最高 | 最高 | 高 | ⭐⭐ 极端隔离 |

---

## 总结

**推荐方案：Profile 多实例架构**

- ✅ 完全隔离（配置、workspace、memory、skills）
- ✅ 易于管理（统一脚本）
- ✅ 官方支持（`--profile` 参数）
- ✅ 灵活扩展（轻松添加新实例）
- ✅ 资源高效（按需启动）

这个方案完美满足你的需求：多个实例互不打扰，各自负责完全不同的内容，且完全独立。
