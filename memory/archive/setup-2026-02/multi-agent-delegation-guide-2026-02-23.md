# OpenClaw 多任务委派官方推荐方案 - 2026-02-23

**调研时间**: 2026-02-23 23:20
**目标**: 了解 OpenClaw 官方推荐的多任务委派架构

---

## 📊 官方推荐的多任务委派方案

### 方案 1：Coordinator + Workers 模式

**核心概念**：
- 1 个 Coordinator Agent（主 Coordinator）：负责任务分配和协调
- 多个 Worker Agents（专业助手）：负责执行具体任务
- 通过 sessions_send 工具进行跨 Agent 通信

**架构**：
```
Telegram Bot
    ↓
Coordinator Agent (main)
    ↓
    ├─→ Worker Agent (research)
    ├─→ Worker Agent (product)
    ├─→ Worker Agent (growth)
    ├─→ Worker Agent (operations)
    ├─→ Worker Agent (logistics)
    ├─→ Worker Agent (backlink)
    └─→ Worker Agent (social)
```

**实现方式**：
```python
# Coordinator Agent 中的任务分配函数
def delegate_task(task_type: str, task_data: dict):
    agent_mapping = {
        "research": "agent:research:main",
        "product": "agent:product:main",
        "growth": "agent:growth:main",
        "operations": "agent:operations:main",
        "logistics": "agent:logistics:main",
        "backlink": "agent:backlink:main",
        "social": "agent:social:main"
    }
    
    target_agent = agent_mapping.get(task_type)
    if not target_agent:
        return {"error": "Unknown task type"}
    
    message = f"Please handle the following task: {json.dumps(task_data)}"
    result = await sessions_send(
        sessionKey=target_agent,
        message=message,
        timeoutSeconds=60
    )
    return result
```

---

### 方案 2：Bindings 智能路由

**核心概念**：
- 通过 Bindings 配置自动路由
- 每个 Bot 对应一个或多个 Agent
- 用户直接向 Bot 发送消息，自动路由到正确的 Agent

**架构**：
```
Telegram Bot 1 → ResearchDDawsonBot
    ↓
    ├─→ Research Agent (research)
    └─→ Social Agent (social)

Telegram Bot 2 → ProductDDawsonBot
    ↓
    ├─→ Product Agent (product)
    └─→ Growth Agent (growth)

Telegram Bot 3 → OperationsDDawsonBot
    ↓
    ├─→ Operations Agent (operations)
    └─→ Backlink Agent (backlink)

Telegram Bot 4 → LogisticsDDawsonBot
    ↓
    ├─→ Logistics Agent (logistics)
    └─→ Coding Agent (coding)

Telegram Bot 5 → BacklinkDDawsonBot
    ↓
    └─→ Backlink Agent (backlink)
```

**优势**：
- ✅ 用户直接向 Bot 发送消息
- ✅ 自动路由到正确的 Agent
- ✅ 不需要 Coordinator 中介

---

### 方案 3：sessions_spawn Sub-agent 模式

**核心概念**：
- Coordinator Agent 使用 sessions_spawn 工具创建短生命周期子 Agent
- 子 Agent 完成任务后自动销毁
- 适合一次性任务

**实现方式**：
```python
# Coordinator Agent 中
result = sessions_spawn(
    task="分析这个网站的外链",
    agentId="backlink",
    model="moonshot/moonshot-v1-128k",
    mode="run"  # 短生命周期
)
```

**优势**：
- ✅ 自动管理生命周期
- ✅ 任务完成后自动销毁
- ✅ 不会累积太多会话

**劣势**：
- ❌ 子 Agent 无法互相通信
- ❌ 不能用于长期任务

---

### 方案 4：任务池 + 心跳机制

**核心概念**：
- 使用飞书 Bitable 或 Redis 作为任务池
- 每个 Agent 定期检查任务池
- 通过心跳机制确保 Agent 活跃

**架构**：
```
飞书 Bitable（任务池）
    ↓
    ├─→ Research Agent（检查新任务）
    ├─→ Product Agent（检查新任务）
    ├─→ Growth Agent（检查新任务）
    ├─→ Operations Agent（检查新任务）
    ├─→ Logistics Agent（检查新任务）
    └─→ Backlink Agent（检查新任务）
```

**实现方式**：
```python
# 每个 Agent 定期检查任务池
def check_task_pool():
    tasks = feishu_bitable.query(
        table="任务池",
        filter={
            "status": "待分配",
            "assignee": "我的 Agent ID"
        }
    )
    
    for task in tasks:
        result = execute_task(task)
        feishu_bitable.update(
            table="任务池",
            id=task.id,
            data={"status": "进行中"}
        )
        
        result = execute_task(task)
        feishu_bitable.update(
            table="任务池",
            id=task.id,
            data={"status": "完成"}
        )
```

**优势**：
- ✅ 所有 Agent 可以自主工作
- ✅ 不需要 Coordinator 中介
- ✅ 任务可追溯和监控

---

## 🎯 推荐方案

### 方案对比

| 方案 | 优势 | 劣势 | 适用场景 |
|------|--------|--------|---------|
| Coordinator + Workers | 集中管理、跨 Agent 通信 | Coordinator 成为瓶颈 | 需要集中协调的任务 |
| Bindings 路由 | 用户直接访问、无需中介 | 无法跨 Agent 通信 | 每个任务类型一个 Bot |
| sessions_spawn | 自动生命周期、适合一次性任务 | 无法跨 Agent 通信 | 临时任务 |
| 任务池 + 心跳 | Agent 自主工作、任务可追溯 | 需要外部任务池 | 批量任务、周期性任务 |

---

## 🎯 建议的架构

### 组合方案：Coordinator + 任务池

**原因**：
- 10 个 Agent 需要集中协调
- 批量任务需要任务池
- 复杂任务需要跨 Agent 通信

**架构**：
```
Telegram Bots（用户界面）
    ↓
Coordinator Agent (main)
    ↓
    ├─→ 任务池（飞书 Bitable）
    │   ↓
    │   ├─→ Research Agent
    │   ├─→ Product Agent
    │   ├─→ Growth Agent
    │   ├─→ Operations Agent
    │   ├─→ Logistics Agent
    │   ├─→ Backlink Agent
    │   └─→ Social Agent
    │
    └─→ sessions_send（跨 Agent 通信）
        ├─→ Worker Agent（需要跨 Agent 通信时）
        └─→ 其他 Agent（需要协调时）
```

**工作流程**：
1. 用户向 Telegram Bot 发送任务
2. Bot 通过 Bindings 路由到 Coordinator Agent
3. Coordinator 分析任务类型
4. Coordinator 将任务分配到任务池
5. 对应的 Worker Agent 检查任务池
6. Worker Agent 执行任务
7. Worker Agent 更新任务池中的任务状态
8. Worker Agent 完成任务后汇报给 Coordinator
9. Coordinator 汇总结果给用户

---

## 🔧 实现步骤

### Step 1：创建任务池表（飞书 Bitable）

**表结构**：
```
- 任务 ID
- 任务类型（research/product/growth/operations/logistics/backlink/social）
- 任务描述
- 分配给（Agent ID）
- 状态（待分配/进行中/完成/失败）
- 创建时间
- 更新时间
- 结果
```

### Step 2：配置 Coordinator Agent

**main Agent 中的功能**：
```python
# 任务分配
def assign_task(task_type: str, task_data: dict):
    feishu_bitable.insert(
        table="任务池",
        data={
            "任务类型": task_type,
            "任务描述": task_data["description"],
            "分配给": f"agent:{task_type}:main",
            "状态": "待分配",
            "创建时间": datetime.now()
        }
    )
    return {"status": "success", "task_id": task_id}

# 任务汇总
def get_task_summary():
    tasks = feishu_bitable.query(
        table="任务池",
        filter={
            "状态": "完成"
        }
    )
    return tasks
```

### Step 3：配置 Worker Agents

**每个 Worker Agent 中的功能**：
```python
# 检查任务池
def check_tasks():
    tasks = feishu_bitable.query(
        table="任务池",
        filter={
            "分配给": "agent:research:main",
            "状态": "待分配"
        }
    )
    
    for task in tasks:
        # 更新任务状态
        feishu_bitable.update(
            table="任务池",
            id=task.id,
            data={"状态": "进行中"}
        )
        
        # 执行任务
        result = execute_task(task)
        
        # 更新任务状态
        feishu_bitable.update(
            table="任务池",
            id=task.id,
            data={"状态": "完成", "结果": result}
        )
```

### Step 4：配置心跳机制

**每个 Agent 的 HEARTBEAT.md**：
```markdown
# 心跳配置

interval_minutes: 5  # 每 5 分钟检查一次

on_heartbeat:
  - check_tasks()  # 检查任务池
  - update_status()  # 更新 Agent 状态
```

---

## 🎯 优先级建议

### 阶段 1：配置 Bindings 路由（立即可做）
- 配置 10 个 Agent 的 Bindings
- 用户直接向 Bot 发送消息

### 阶段 2：创建任务池（1-2 小时）
- 在飞书 Bitable 创建任务池表
- 设计任务分配逻辑

### 阶段 3：配置 Coordinator + Workers（2-3 小时）
- 配置 main Agent 作为 Coordinator
- 配置 9 个 Worker Agent
- 测试任务分配流程

---

## 📋 总结

### 官方推荐的多任务委派方案：
1. ✅ Coordinator + Workers 模式
2. ✅ Bindings 智能路由
3. ✅ sessions_spawn Sub-agent 模式
4. ✅ 任务池 + 心跳机制

### 推荐架构：
**组合方案**：Coordinator + 任务池
- 集中协调
- 任务可追溯
- Agent 自主工作
- 跨 Agent 通信

---

**创建时间**: 2026-02-23 23:20
