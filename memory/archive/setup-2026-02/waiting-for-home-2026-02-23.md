# 等待主人回家 - 2026-02-23

**等待时间**: 2026-02-23 21:00
**当前状态**: Gateway 运行中，work/coding/home Agent 在 agents.json 中定义，但只有 main Agent 有完整目录

---

## 🔍 当前发现

### Agents 列表
- main (default) ✅ 完整：workspace + agent dir
- work ⚠️ 只在 agents.json 中定义，没有 agent dir
- coding ⚠️ 只在 agents.json 中定义，没有 agent dir
- home ⚠️ 只在 agents.json 中定义，没有 agent dir

### 问题
- work 和 coding Agent 无法独立运行（缺少 workspace 和 agent 目录）
- 可能无法响应 Telegram 消息
- SOUL.md 可能在错误的目录

---

## 🎯 建议方案

### 方案 A：删除错误的 Agent 定义，使用 TUI 重建（推荐）

**理由**：
- TUI 交互可以保证 Agent 结构完整
- 避免手动编辑 JSON 的错误

**步骤**：
1. 使用 `openclaw configure` 删除 work 和 coding Agent 定义
2. 使用 TUI 重新创建（确保 workspace 和 agent dir 自动生成）
3. 配置 Bindings
4. 测试验证

**预计时间**：10-20 分钟

### 方案 B：等主人回家后再做

**优点**：
- 你可以在 TUI 中交互式操作
- 可以看到界面反馈
- 避免命令行错误

**缺点**：
- 需要等待你回家
- 无法立即验证

---

## 🤔 需要你确认的

1. **方案选择**：
   - 方案 A：我现在就删除错误的定义，等你回家后用 TUI 重建
   - 方案 B：等你回家后再操作

2. **coding-bot Token 确认**：
   - 当前使用的是 DDawson1Bot (8513427490:AAGGOzVsWqko5NEcXn1GbanEIo33Ept8FC0)
   - 这是之前创建的
   - 需要确认是否用于 coding Agent

3. **下一步优先级**：
   - P0：Agent 重建
   - P1：社媒监控体系
   - P2：pmset 命令

---

## 📊 当前待办

根据之前讨论，P0 紧急任务包括：
1. Agent 重建
2. 一键初始化脚本
3. pmset 命令执行

**建议**：优先级排序
- 先做 Agent 重建（确保架构稳定）
- 再做 pmset 命令（解决睡眠问题）
- 最后补全一键初始化脚本

---

**等待你的指示**：
- 现在就删除错误的 work 和 coding Agent 定义？
- 还是等你回家后用 TUI 重建？
- 还是先做其他事情？

要哪个？