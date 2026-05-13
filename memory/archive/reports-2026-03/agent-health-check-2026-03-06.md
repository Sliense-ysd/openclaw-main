# Agent 健康检查报告
生成时间: 2026-03-06 00:40

## 问题总结

### Research Agent 无响应
- **根本原因**: codesome API 每日配额用完 (`429 DAILY_LIMIT_EXCEEDED`)
- **当前状态**: 已切换到 `friend-codesome/claude-opus-4-6-20250219`
- **测试结果**: friend-codesome API 可用，但 research agent 仍无响应

## 各 Agent 状态

| Agent | 上下文使用 | 当前模型 | 状态 |
|-------|-----------|---------|------|
| main | 105k/200k (53%) | claude-opus-4-6-20250219 | ✅ 正常 |
| research | 134k/200k (67%) | friend-codesome/claude-opus-4-6-20250219 | ❌ 无响应 |
| growth | 161k/200k (80%) | claude-sonnet-4-5-20251022 | ⚠️ 接近阈值 |
| product | 95k/200k (48%) | kimi-k2.5 | ✅ 正常 |
| coding | - | zhipu-anthropic/claude-sonnet-4-5-20251022 | ✅ 正常 |
| operations | - | zhipu-anthropic/claude-sonnet-4-5-20251022 | ✅ 正常 |
| backlink | - | zhipu-anthropic/claude-sonnet-4-5-20251022 | ✅ 正常 |
| task | 110k/200k (55%) | claude-opus-4-6-20250219 | ✅ 正常 |

## 监控机制状态

### 1. 上下文过载监控
- **状态**: ✅ 运行中
- **阈值**: 90% (180k/200k)
- **当前最高**: growth 80% (161k/200k)
- **触发**: 未触发

### 2. API Failover 机制
- **状态**: ✅ 运行中
- **触发**: codesome API 429 错误 → 自动切换到 friend-codesome
- **问题**: friend-codesome 配置后 research agent 仍无响应

### 3. Token 用量监控
- **状态**: ⚠️ 脚本已创建，但未启动 cron
- **位置**: `~/.openclaw/skills/api-failover-smart/scripts/daily-token-check.sh`
- **需要**: 添加到 crontab

## 修复方案

### 立即修复 (P0)

1. **重启 research agent 会话**
   ```bash
   openclaw sessions clear research
   ```

2. **验证 friend-codesome provider**
   - API 测试通过 ✅
   - 配置正确 ✅
   - 可能需要重启 Gateway

3. **临时降级 research agent 到 Sonnet**
   ```bash
   openclaw config set 'agents.list[] | select(.id == "research").model' 'friend-codesome/claude-sonnet-4-5-20251022'
   openclaw gateway restart
   ```

### 短期优化 (P1)

1. **清理 growth agent 上下文**
   ```bash
   openclaw sessions clear growth
   ```

2. **启动 token 监控 cron**
   ```bash
   chmod +x ~/.openclaw/skills/api-failover-smart/scripts/daily-token-check.sh
   (crontab -l 2>/dev/null; echo "0 * * * * ~/.openclaw/skills/api-failover-smart/scripts/daily-token-check.sh") | crontab -
   ```

3. **优化 fallback 链**
   - 主 agent: codesome → friend-codesome → bailian
   - 其他 agent: friend-codesome → codesome → moonshot

### 长期改进 (P2)

1. **实现智能路由**
   - 根据 token 用量自动分配 provider
   - 主 agent 优先使用高质量 API
   - 非关键 agent 使用备用 API

2. **增加监控告警**
   - token 用量 > 80% 发送 Telegram 通知
   - API 错误率 > 5% 发送告警
   - 上下文 > 85% 自动清理

3. **定期清理机制**
   - 每日 00:00 清理非活跃会话
   - 每周清理 cron 会话历史
   - 保留最近 7 天的重要会话

## 下一步行动

1. 立即执行 P0 修复
2. 验证 research agent 恢复
3. 启动 token 监控
4. 观察 24 小时后的稳定性
