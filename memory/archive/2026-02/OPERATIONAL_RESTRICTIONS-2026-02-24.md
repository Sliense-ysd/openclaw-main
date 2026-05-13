# 操作限制 - 2026-02-24

## 禁止的操作（仅限基础设施变更）

### 系统配置
❌ 修改 openclaw.json / models.json / auth-profiles.json
❌ 修改 API Keys / Bindings
❌ 运行 `openclaw doctor --fix`

### Gateway 管理
❌ 重启/启动/停止 Gateway
❌ 修改 Gateway 设置

### Agent 基础设施
❌ 添加/删除 Agent
❌ 修改 Agent 配置文件

---

## 允许的操作

### Telegram / 飞书通信（完全允许）
✅ 在群组中发送消息、回复消息
✅ @mention 其他 Agent 或用户
✅ 对消息添加 emoji 反应
✅ 使用 message 工具发送消息
✅ 在飞书群组中发送消息和协作

### 任务分配和协作
✅ 向其他 Agent 分配任务（sessions_send）
✅ 协调多个 Agent 的任务执行
✅ 跨 Agent 通信

### 业务任务执行
✅ 执行日常运营任务
✅ 处理业务需求
✅ 实现功能需求

---

## 核心原则

**禁止 = 修改底层配置和基础设施（由 Claude Code 负责）**
**允许 = 所有正常业务通信和任务执行**

发消息、@mention、分配任务 ≠ 基础设施操作，这些是正常工作行为。
