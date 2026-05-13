#!/bin/bash
# OpenClaw Agent 脚本迁移工具
# 用法: ./migrate-agent-scripts.sh <agent-name> [--dry-run]

set -e

AGENT=$1
DRY_RUN=${2:-""}
WORKSPACE_BASE="$HOME/.openclaw"
WORKSPACE="$WORKSPACE_BASE/workspace-$AGENT"
BACKUP_DIR="$WORKSPACE_BASE/backup/migrate-$(date +%Y%m%d-%H%M%S)/$AGENT"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ -z "$AGENT" ]; then
  error "请指定 agent 名称"
  echo "用法: $0 <agent-name> [--dry-run]"
  echo "示例: $0 operations"
  exit 1
fi

if [ ! -d "$WORKSPACE" ]; then
  error "Agent workspace 不存在: $WORKSPACE"
  exit 1
fi

# 创建备份
backup() {
  log "创建备份到 $BACKUP_DIR"
  if [ "$DRY_RUN" != "--dry-run" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$WORKSPACE" "$BACKUP_DIR/"
    crontab -l > "$BACKUP_DIR/crontab.txt" 2>/dev/null || true
    cp ~/Library/LaunchAgents/*openclaw* "$BACKUP_DIR/" 2>/dev/null || true
    log "备份完成"
  else
    log "[DRY-RUN] 将备份到 $BACKUP_DIR"
  fi
}

# 创建标准目录结构
create_structure() {
  log "创建标准目录结构"
  if [ "$DRY_RUN" != "--dry-run" ]; then
    mkdir -p "$WORKSPACE/scripts/cron"
    mkdir -p "$WORKSPACE/scripts/tools"
    mkdir -p "$WORKSPACE/scripts/archived"
    log "目录创建完成"
  else
    log "[DRY-RUN] 将创建:"
    log "  - $WORKSPACE/scripts/cron"
    log "  - $WORKSPACE/scripts/tools"
    log "  - $WORKSPACE/scripts/archived"
  fi
}

# 盘点现有脚本
inventory() {
  log "盘点现有脚本..."
  local scripts=$(find "$WORKSPACE" -type f \( -name "*.sh" -o -name "*.js" \) | grep -v node_modules | grep -v "/scripts/" | grep -v "/skills/")
  
  if [ -z "$scripts" ]; then
    log "没有发现需要迁移的脚本"
    return
  fi
  
  log "发现以下脚本需要迁移:"
  echo "$scripts" | while read script; do
    echo "  - $script"
  done
}

# 生成注册表模板
generate_registry() {
  log "生成 CRON_REGISTRY.md 模板"
  
  local registry_file="$WORKSPACE/CRON_REGISTRY.md"
  
  if [ "$DRY_RUN" != "--dry-run" ]; then
    cat > "$registry_file" << EOF
# Agent: $AGENT 定时任务注册表

> 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
> 此文件由 migrate-agent-scripts.sh 自动生成

## 活跃任务

| 名称 | 脚本路径 | 触发方式 | 频率 | 状态 | 备注 |
|-----|---------|---------|------|------|------|
| (请补充) | scripts/cron/xxx.sh | (crontab/LaunchAgent/OpenClaw) | (频率) | ⏸️ 待配置 | - |

## 已禁用任务

| 名称 | 脚本路径 | 禁用原因 | 禁用时间 |
|-----|---------|---------|---------|
| (请补充) | scripts/archived/xxx.sh | (原因) | $(date '+%Y-%m-%d') |

## 检查清单

- [ ] 所有脚本都已注册？
- [ ] 触发方式是否明确？
- [ ] 日志输出是否正常？

## 迁移记录

- 迁移时间: $(date '+%Y-%m-%d %H:%M:%S')
- 备份位置: $BACKUP_DIR
- 执行人: $(whoami)
EOF
    log "注册表模板已生成: $registry_file"
  else
    log "[DRY-RUN] 将生成注册表模板"
  fi
}

# 主流程
main() {
  log "开始迁移 Agent: $AGENT"
  [ "$DRY_RUN" == "--dry-run" ] && warn "当前为试运行模式，不会实际修改文件"
  
  backup
  create_structure
  inventory
  generate_registry
  
  log "迁移准备完成"
  warn "下一步: 手动检查并补充 CRON_REGISTRY.md，然后执行实际迁移"
  
  if [ "$DRY_RUN" != "--dry-run" ]; then
    log "备份位置: $BACKUP_DIR"
    log "如需回滚，执行: cp -r $BACKUP_DIR/workspace-$AGENT $WORKSPACE_BASE/"
  fi
}

main
