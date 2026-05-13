# OpenClaw 多 Agent 脚本目录规范与整理方案

## 1. 现状分析

### 1.1 混乱现状

| Agent | 脚本位置 | 混乱程度 |
|-------|---------|---------|
| main | workspace/scripts/ + scripts/core/ + modules/ + .openclaw/ | 🔴 严重 |
| coding | workspace-coding/scripts/ | 🟡 中等 |
| research | workspace-research/scripts/ | 🟡 中等 |
| product | workspace-product/cron-tasks/ | 🟡 中等 |
| growth | workspace-growth/skills/*/scripts/ | 🟡 中等 |
| operations | workspace-operations/content-monitor/scripts/ + cron-tasks/scripts/ | 🔴 严重 |
| backlink | workspace-backlink/ 根目录 | 🔴 最严重 |
| task | workspace-task/scripts/ | 🟢 轻度 |
| kol | (空) | 🟢 无 |
| users | (空) | 🟢 无 |

### 1.2 核心问题

1. **无统一规范**：每个 agent 自己决定脚本放哪里
2. **无注册机制**：脚本创建了但没人知道
3. **无审计机制**：无法发现"幽灵脚本"
4. **触发方式分散**：crontab、LaunchAgent、OpenClaw Cron 混用
5. **缺少备份**：整理时容易丢失脚本

---

## 2. 统一规范设计

### 2.1 目录结构（所有 Agent 统一）

```
~/.openclaw/workspace-{agent}/
├── AGENT.md                    # Agent 说明书（必须）
├── CRON_REGISTRY.md            # 定时任务注册表（必须）
├── scripts/
│   ├── cron/                   # 定时任务脚本（被外部触发）
│   ├── tools/                  # 工具脚本（手动执行）
│   └── archived/               # 已废弃脚本归档
├── skills/
│   └── */scripts/              # Skill 内部脚本（仅限 Skill 使用）
└── [其他业务目录]               # 业务相关文件
```

### 2.2 脚本分类规则

| 类型 | 位置 | 触发方式 | 示例 |
|-----|------|---------|------|
| 定时任务 | `scripts/cron/` | crontab/LaunchAgent/OpenClaw Cron | `daily-backup.sh` |
| 工具脚本 | `scripts/tools/` | 手动执行 | `reset-session.sh` |
| Skill 脚本 | `skills/{name}/scripts/` | Skill 内部调用 | `monitor.js` |
| 已废弃 | `scripts/archived/` | 不执行 | `old-script.sh.disabled` |

### 2.3 注册表格式（CRON_REGISTRY.md）

```markdown
# Agent: {agent-name} 定时任务注册表

## 活跃任务

| 名称 | 脚本路径 | 触发方式 | 频率 | 状态 | 备注 |
|-----|---------|---------|------|------|------|
| 每日备份 | scripts/cron/backup.sh | crontab | 每天 0:00 | ✅ 活跃 | - |

## 已禁用任务

| 名称 | 脚本路径 | 禁用原因 | 禁用时间 |
|-----|---------|---------|---------|
| 旧监控 | scripts/archived/old-monitor.sh |  replaced by new | 2026-03-07 |

## 检查清单

- [ ] 所有脚本都已注册？
- [ ] 触发方式是否明确？
- [ ] 日志输出是否正常？
```

---

## 3. 渐进式迁移方案

### 3.1 阶段一：备份与盘点（第 1 天）

**目标**：不改动任何文件，只盘点现状

```bash
# 1. 备份所有脚本
mkdir -p ~/.openclaw/backup/scripts-$(date +%Y%m%d)
find ~/.openclaw/workspace* -name "*.sh" -o -name "*.js" | xargs -I {} cp {} ~/.openclaw/backup/scripts-$(date +%Y%m%d)/

# 2. 生成盘点报告
for agent in main coding research product growth operations backlink task kol users; do
  echo "=== $agent ===" >> ~/agent-scripts-inventory.txt
  find ~/.openclaw/workspace-$agent -type f \( -name "*.sh" -o -name "*.js" \) 2>/dev/null | grep -v node_modules >> ~/agent-scripts-inventory.txt
  echo "" >> ~/agent-scripts-inventory.txt
done
```

### 3.2 阶段二：主 Agent 试点（第 2-3 天）

**目标**：先整理 main agent，验证方案可行性

1. 创建标准目录结构
2. 移动脚本到对应位置
3. 创建 CRON_REGISTRY.md
4. 更新触发配置（crontab/LaunchAgent）
5. 验证所有任务正常运行

### 3.3 阶段三：批量迁移（第 4-7 天）

**目标**：按优先级逐个整理其他 agents

优先级：
1. operations（最乱，有 2 个脚本目录）
2. backlink（根目录乱放）
3. growth（脚本藏在 skills 里）
4. product、coding、research（中等混乱）
5. task、kol、users（轻度或为空）

### 3.4 阶段四：审计机制（第 8 天起）

**目标**：建立长期防混乱机制

1. 每周运行审计脚本
2. 发现未注册脚本时告警
3. 强制要求新脚本必须注册

---

## 4. 数据安全与备份

### 4.1 备份策略

```bash
# 迁移前自动备份
pre_migrate_backup() {
  local agent=$1
  local backup_dir="~/.openclaw/backup/migrate-$(date +%Y%m%d-%H%M%S)/$agent"
  mkdir -p "$backup_dir"
  
  # 备份整个 workspace
  cp -r ~/.openclaw/workspace-$agent "$backup_dir/"
  
  # 备份 crontab
  crontab -l > "$backup_dir/crontab.txt" 2>/dev/null || true
  
  # 备份 LaunchAgent
  cp ~/Library/LaunchAgents/*openclaw* "$backup_dir/" 2>/dev/null || true
  
  echo "备份完成: $backup_dir"
}
```

### 4.2 回滚方案

如果迁移后出现问题：

```bash
rollback_agent() {
  local agent=$1
  local backup_dir=$2
  
  # 恢复 workspace
  rm -rf ~/.openclaw/workspace-$agent
  cp -r "$backup_dir/$agent/workspace-$agent" ~/.openclaw/
  
  # 恢复 crontab
  crontab "$backup_dir/crontab.txt"
  
  echo "已回滚 $agent"
}
```

---

## 5. 审计脚本

```bash
#!/bin/bash
# agent-scripts-audit.sh
# 检查指定 agent 是否有未注册的脚本

AGENT=$1
WORKSPACE="~/.openclaw/workspace-$AGENT"
REGISTRY="$WORKSPACE/CRON_REGISTRY.md"

if [ ! -f "$REGISTRY" ]; then
  echo "❌ $AGENT: 缺少 CRON_REGISTRY.md"
  exit 1
fi

# 查找所有脚本
find "$WORKSPACE" -type f \( -name "*.sh" -o -name "*.js" \) | grep -v node_modules | while read script; do
  script_name=$(basename "$script")
  if ! grep -q "$script_name" "$REGISTRY"; then
    echo "⚠️  $AGENT: 未注册脚本 - $script"
  fi
done

echo "✅ $AGENT 审计完成"
```

---

## 6. 实施检查清单

### 迁移前
- [ ] 已备份所有脚本
- [ ] 已盘点所有定时任务
- [ ] 已通知相关人员

### 迁移中
- [ ] 按阶段执行
- [ ] 每步验证
- [ ] 发现问题立即回滚

### 迁移后
- [ ] 所有脚本已注册
- [ ] 所有任务正常运行
- [ ] 审计脚本已部署
- [ ] 文档已更新

---

## 7. 兼容性考虑

1. **现有脚本路径**：迁移后创建软链接，确保旧路径仍能访问
2. **触发配置**：逐步更新 crontab/LaunchAgent，不一次性全改
3. **Skill 脚本**：Skill 内部脚本保持不动，只规范入口
4. **日志路径**：保持原有日志路径，避免日志分析工具失效

---

**方案制定时间**: 2026-03-07
**建议实施周期**: 1 周
**负责人**: 主Agent
