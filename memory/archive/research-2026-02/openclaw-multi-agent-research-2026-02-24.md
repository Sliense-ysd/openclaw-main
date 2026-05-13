# OpenClaw 多 Agent 协作调研 - 2026-02-24

**调研时间**: 2026-02-24 00:35
**目标**: 了解社区如何通过 OpenClaw 实现任务池和 Agent 协作

---

## 📊 社区最佳实践总结

### 方案 1：Coordinator + Workers 模式

**核心理念**：
- 1 个 Coordinator Agent（任务分配和协调）
- 多个 Worker Agents（执行具体任务）
- 通过 `sessions_send` 工具进行跨 Agent 通信

**架构**：
```
用户 → Telegram Bot → Coordinator Agent (main)
    ↓
分配任务 → 创建任务到任务池
    ↓
向 Worker Bot 发送消息通知
    ↓
Worker Agents 接收任务并执行
```

**关键代码**：
```python
# Coordinator Agent 中
def delegate_task(task_type: str, task_data: dict):
    """委派任务到 Worker Agent"""
    agent_session_key = f"agent:{task_type}:main"
    
    message = f"""
任务类型: {task_type}
任务标题: {task_data.get('title', '')}
任务描述: {task_data.get('description', '')}
优先级: {task_data.get('priority', 3)}

请开始执行任务。
    """
    
    sessions_send(
        sessionKey=agent_session_key,
        message=message,
        timeoutSeconds=60
    )
```

**优点**：
- ✅ 集中协调
- ✅ 跨 Agent 通信
- ✅ 任务可追踪

**缺点**：
- ❌ Coordinator 成为瓶颈
- ❌ 需要 Telegram 通知机制

---

### 方案 2：Agent Teams 模式

**核心理念**：
- 多个 Agents 在同一个 Gateway 下运行
- 通过 Agent Teams 配置协作规则
- 支持 Agent 间直接通信

**架构**：
```
┌────────────────────────────────┴────────┐
│        Coordinator Agent (main)         │
│            ↓  ↓  ↓                  │
│    Research   Product   Growth      │
│    Agent     Agent    Agent       │
└────────────────────────────────────────┘
```

**关键配置**：
```yaml
# agents.md（在每个 Agent 的 workspace 中）
team: "My Team"
members:
  - name: "Coordinator"
    role: "coordinator"
    session: "agent:main:main"
  - name: "Research"
    role: "research"
    session: "agent:research:main"
  - name: "Product"
    role: "product"
    session: "agent:product:main"
  - name: "Growth"
    role: "growth"
    session: "agent:growth:main"
  - name: "Operations"
    role: "operations"
    session: "agent:operations:main"
  - name: "Backlink"
    role: "backlink"
    session: "agent:backlink:main"
  - name: "Social"
    role: "social"
    session: "agent:social:main"
  - name: "Coding"
    role: "coding"
    session: "agent:coding:main"

workflows:
  name: "Task Assignment"
  steps:
    - agent: "Coordinator"
      task: "接收任务请求"
    - agent: "Research"
      task: "执行调研任务"
    - agent: "Product"
      task: "执行产品任务"
    - agent: "Growth"
      task: "执行增长任务"
    - agent: "Operations"
      task: "执行运营任务"
    - agent: "Backlink"
      task: "执行外链任务"
    - agent: "Social"
      task: "执行社媒任务"
    - agent: "Coding"
      task: "执行技术任务"
```

**优点**：
- ✅ 原生支持 Agent 间通信
- ✅ 无需外部服务（Telegram/飞书）
- ✅ 更稳定和可靠

**缺点**：
- ❌ 需要配置 agents.md
- ❌ 学习曲线较高

---

### 方案 3：任务池 + 心跳模式

**核心理念**：
- 使用飞书 Bitable 作为任务池
- 每个 Agent 每 N 分钟检查一次任务池
- Agent 执行任务后更新状态

**架构**：
```
飞书 Bitable（任务池）
    ↓
每 5 分钟
    ↓
10 个 Agent（检查任务池）
    ↓
执行任务 → 更新状态
```

**关键配置**：
```python
# 每个 Agent 的心跳
# HEARTBEAT.md
interval_minutes: 5

on_heartbeat:
  - check_tasks()      # 检查任务池
  - execute_task()     # 执行任务
  - update_status()    # 更新状态
  - report_completion() # 汇报完成
```

**优点**：
- ✅ 任务可追踪
- ✅ 状态管理清晰
- ✅ 可视化（通过飞书）

**缺点**：
- ❌ 依赖外部服务（飞书）
- ❌ 延迟 N 分钟

---

### 方案 4：组合方案（推荐）

**核心理念**：
- Telegram 用于实时通知
- 飞书 Bitable 用于任务追踪
- Agent 间通过 `sessions_send` 协作

**架构**：
```
用户 → Telegram Bot
    ↓
Coordinator Agent (main)
    ↓
    ├─→ 创建任务到飞书 Bitable
    ├─→ 向 Worker Bot 发送通知
    └─→ 汇总结果

Worker Agents (10 个）
    ↓
    ├─→ 接收 Telegram 通知
    ├─→ 检查飞书 Bitable
    ├─→ 执行任务
    └─→ 更新任务状态
```

**优点**：
- ✅ 实时通知（Telegram）
- ✅ 任务追踪（飞书 Bitable）
- ✅ Agent 协作（sessions_send）
- ✅ 可视化（飞书仪表板）

**缺点**：
- ❌ 依赖两个外部服务
- ❌ 配置复杂度增加

---

## 🎯 官方推荐方案

### OpenClaw 官方推荐

**文档**：https://docs.openclaw.ai/concepts/multi-agent

**核心要点**：
1. ✅ 单 Gateway + 多 Agent 架构
2. ✅ 每个 Agent 有独立 workspace
3. ✅ 使用 Bindings 智能路由
4. ✅ 支持 Agent 间通信

---

## 🎯 社区推荐方案

### 推荐 1：Clawdbot + Telegram

**项目**：https://github.com/openclaw/clawe/clawe

**核心理念**：
- 预配置的 OpenClaw agent 模板
- 专注于任务管理
- 支持 Telegram 集成

**关键特性**：
- 任务分配和追踪
- 进度更新
- Telegram 通知
- 支持依赖关系

### 推荐 2：OpenClaw Agent Teams

**项目**：https://github.com/openclaw/openclaw/discussions/10036

**核心理念**：
- 原生 Agent 间通信支持
- Agent Teams 配置
- 可视化 Dashboard

**关键特性**：
- 原生多 Agent 支持
- 工作流定义
- 任务依赖管理
- Agent 状态追踪

---

## 🎯 对你的建议

### 方案 1：简单方案（推荐开始）

**架构**：
```
Coordinator Agent (main)
    ↓
通过 sessions_send 向 Worker Agent 发送任务

Worker Agents (10 个)
    ↓
1. 接收任务通知（Telegram）
2. 执行任务
3. 更新状态（通过 Telegram 或飞书）
4. 汇报结果（通过 sessions_send）
```

**优点**：
- ✅ 配置简单
- ✅ 不依赖飞书 Bitable
- ✅ 快速实施

---

### 方案 2：完整方案（推荐中期）

**架构**：
```
Coordinator Agent (main)
    ↓
1. 创建任务到飞书 Bitable
2. 向 Worker Bot 发送 Telegram 通知
3. 汇总结果

Worker Agents (10 个)
    ↓
1. 接收 Telegram 通知
2. 检查飞书 Bitable（每 5 分钟）
3. 执行任务
4. 更新飞书 Bitable 状态
5. 汇报结果
```

**优点**：
- ✅ 完整的任务追踪
- ✅ 可视化仪表板
- ✅ 长期数据保存

---

## 🎯 下一步建议

### 立即执行（今天）

1. **实现简单方案**：
   - 配置 Coordinator 的任务分配功能
   - 配置 Worker Agents 的任务接收功能
   - 使用 Telegram Bot 通知
   - 不使用飞书 Bitable

2. **验证工作流**：
   - Coordinator 分配任务
   - Worker 接收并执行任务
   - Worker 汇报结果
   - 验证跨 Agent 通信

### 中期规划（本周）

1. **实现完整方案**：
   - 配置飞书 Bitable API
   - 创建任务池表格
   - 实现任务追踪功能
   - 添加可视化仪表板

---

## 📋 关键代码示例

### Coordinator 任务分配

```python
# main Agent 中的功能
def assign_task(task_type, task_data, priority=3):
    """分配任务到 Worker Agent"""
    agent_session_key = f"agent:{task_type}:main"
    
    message = f"""
📋 新任务

任务 ID: task-{datetime.now().strftime('%Y%m%d%H%M%S')}
任务类型: {task_type}
任务标题: {task_data.get('title', '')}
任务描述: {task_data.get('description', '')}
优先级: {priority}

请开始执行任务。
    """
    
    result = sessions_send(
        sessionKey=agent_session_key,
        message=message,
        timeoutSeconds=60
    )
    
    return result
```

### Worker 任务接收

```python
# Worker Agent 中的功能（自动通过 Telegram 实现）
def receive_task_notification():
    """接收任务通知"""
    # 这个功能是自动的，通过 Telegram Bot 实现
    pass
```

### Worker 任务执行

```python
# Worker Agent 中的功能
def execute_task(task):
    """执行任务"""
    task_id = task['fields']['任务 ID']
    task_type = task['fields']['任务类型']
    
    # 执行任务（根据任务类型）
    result = execute_task_by_type(task)
    
    # 汇报结果
    notify_coordinator(task_id, result)
    
    return result
```

---

**创建时间**: 2026-02-24 00:35
