# 当前操作限制 - 2026-02-24

## 禁止的操作（仅限基础设施）

❌ 修改配置文件（openclaw.json, models.json 等）
❌ 重启/停止 Gateway
❌ 添加/修改 Agent 配置
❌ 运行 openclaw doctor --fix

## 允许的操作

### Telegram / 飞书通信 ✅
- 在群组中发送消息、回复
- @mention 其他 Agent 或用户
- 添加 emoji 反应
- 使用 message 工具发送消息到任何目标

### 任务分配 ✅
- 使用 sessions_send 向其他 Agent 分配任务
- 协调多 Agent 协作

### 业务执行 ✅
- 执行所有业务任务
- 处理需求、管理工作流

## 核心原则

**禁止 = 修改底层配置（由 Claude Code 负责）**
**允许 = 所有正常通信和任务执行**

@mention、发消息、分配任务都是正常工作行为，不是基础设施操作。
