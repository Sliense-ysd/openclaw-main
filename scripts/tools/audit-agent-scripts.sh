#!/bin/bash
# OpenClaw Agent 脚本审计工具
# 检查是否有未注册的脚本
# 用法: ./audit-agent-scripts.sh [agent-name|all]

set -e

TARGET=${1:-"all"}
WORKSPACE_BASE="$HOME/.openclaw"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 审计单个 agent
audit_agent() {
  local agent=$1
  local workspace="$WORKSPACE_BASE/workspace-$agent"
  local registry="$workspace/CRON_REGISTRY.md"
  
  log "审计 Agent: $agent"
  
  if [ ! -d "$workspace" ]; then
    warn "Agent $agent 不存在，跳过"
    return
  fi
  
  if [ ! -f "$registry" ]; then
    error "$agent: 缺少 CRON_REGISTRY.md"
    return 1
  fi
  
  local unregistered=0
  
  # 查找所有脚本（排除标准目录和 node_modules）
  find "$workspace" -type f \( -name "*.sh" -o -name "*.js" \) | grep -v node_modules | while read script; do
    local script_name=$(basename "$script")
    local rel_path=${script#$workspace/}
    
    # 跳过标准目录中的脚本
    if [[ "$rel_path" == scripts/* ]] || [[ "$rel_path" == skills/* ]]; then
      continue
    fi
    
    # 检查是否已注册
    if ! grep -q "$script_name" "$registry" 2>/dev/null; then
      warn "$agent: 未注册脚本 - $rel_path"
      unregistered=$((unregistered + 1))
    fi
  done
  
  if [ $unregistered -eq 0 ]; then
    log "$agent: ✅ 所有脚本已注册"
  else
    error "$agent: 发现 $unregistered 个未注册脚本"
  fi
}

# 主流程
main() {
  log "开始脚本审计..."
  
  if [ "$TARGET" == "all" ]; then
    local agents=(main coding research product growth operations backlink task kol users)
    for agent in "${agents[@]}"; do
      audit_agent "$agent"
      echo ""
    done
  else
    audit_agent "$TARGET"
  fi
  
  log "审计完成"
}

main
