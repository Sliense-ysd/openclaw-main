# 任务池设计 - 2026-02-23

**创建时间**: 2026-02-23 23:30
**目标**: 设计任务池表结构和实现方案

---

## 📊 任务池表结构（飞书 Bitable）

### 表 1：任务主表

| 字段 | 类型 | 说明 |
|------|------|------|
| 任务 ID | string | 唯一标识符（自动生成） |
| 任务类型 | string | research/product/growth/operations/logistics/backlink/social |
| 任务描述 | text | 任务的具体描述 |
| 分配给 | string | Agent ID（agent:research:main 等） |
| 状态 | string | 待分配/进行中/完成/失败/取消 |
| 优先级 | number | 1-5（1 最高，5 最低） |
| 创建时间 | datetime | 任务创建时间 |
| 更新时间 | datetime | 任务最后更新时间 |
| 完成时间 | datetime | 任务完成时间 |
| 结果 | text | 任务执行结果 |
| 错误信息 | text | 错误时的错误信息 |
| 创建者 | string | 创建任务的来源（Coordinator 或用户） |

### 表 2：Agent 状态表

| 字段 | 类型 | 说明 |
|------|------|------|
| Agent ID | string | Agent 唯一标识符 |
| 最后心跳 | datetime | Agent 最后心跳时间 |
| 当前任务 | string | 当前正在执行的任务 ID |
| 状态 | string | active/idle/error |
| 错误信息 | text | 错误时的错误信息 |

### 表 3：任务队列表

| 字段 | 类型 | 说明 |
|------|------|------|
| 队列 ID | string | 唯一标识符（自动生成） |
| 任务 ID | string | 关联到任务主表 |
| 任务类型 | string | 任务的类型 |
| 优先级 | number | 1-5 |
| 入队时间 | datetime | 任务进入队列的时间 |
| 处理状态 | string | waiting/processing/completed/failed |

---

## 🔧 实现方案

### 方案 1：使用飞书 Bitable API

**优势**：
- ✅ 易于查看和编辑
- ✅ 支持协作
- ✅ 已有的 API 集成

**劣势**：
- ❌ 需要 API Key
- ❌ 需要配置飞书应用
- ❌ 可能需要手动创建表

---

### 方案 2：使用本地 JSON 文件

**优势**：
- ✅ 无需外部依赖
- ✅ 快速实现
- ✅ 易于备份和迁移

**劣势**：
- ❌ 不支持协作
- ❌ 需要自己实现并发控制
- ❌ 没有可视化界面

---

### 方案 3：使用 OpenClaw 的 sessions.json

**优势**：
- ✅ 原生支持
- ✅ 无需外部依赖
- ✅ 已有的会话管理机制

**劣势**：
- ❌ 不适合批量任务管理
- ❌ 没有任务状态字段
- ❌ 无法追踪任务分配历史

---

## 🎯 推荐方案：飞书 Bitable + 本地 JSON

**原因**：
- 飞书 Bitable 适合长期存储和可视化
- 本地 JSON 适合快速访问和缓存
- 结合两者的优势

---

## 🔧 实现步骤

### Step 1：配置飞书 Bitable API

**创建飞书应用**：
1. 登录飞书开放平台
2. 创建新的应用
3. 获取 App ID 和 App Secret
4. 启用 Bitable 权限
5. 创建 Bitable（任务池）

**表创建**：
- 创建 3 个表（任务主表、Agent 状态表、任务队列表）

---

### Step 2：创建本地 JSON 文件

**文件结构**：
```
~/.openclaw/tasks/
├── tasks.json              # 任务主表
├── agent-status.json        # Agent 状态表
├── task-queue.json         # 任务队列
└── logs/                  # 任务日志
    ├── 2026-02-23.json
    ├── 2026-02-24.json
    └── ...
```

**示例 tasks.json**：
```json
{
  "tasks": [
    {
      "id": "task-2026-02-23-001",
      "type": "research",
      "description": "调研这个网站的外链",
      "assignee": "agent:backlink:main",
      "status": "waiting",
      "priority": 1,
      "createdAt": "2026-02-23T23:30:00Z",
      "updatedAt": "2026-02-23T23:30:00Z",
      "completedAt": null,
      "result": null,
      "error": null,
      "creator": "coordinator"
    }
  ]
}
```

---

### Step 3：实现 Coordinator Agent 功能

**Coordinator Agent 中的功能**：
```python
# 任务分配
def assign_task(task_type: str, task_data: dict, priority: int = 3):
    """分配任务到任务池"""
    task = {
        "id": f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": task_type,
        "description": task_data.get("description", ""),
        "assignee": f"agent:{task_type}:main",
        "status": "waiting",
        "priority": priority,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
        "completedAt": None,
        "result": None,
        "error": None,
        "creator": "coordinator"
    }
    
    # 保存到本地 JSON
    save_to_tasks_json(task)
    
    # 同步到飞书 Bitable
    sync_to_feishu(task)
    
    return {"status": "success", "task_id": task["id"]}

# 任务汇总
def get_task_summary(status: str = None):
    """获取任务汇总"""
    tasks = load_from_tasks_json()
    
    if status:
        tasks = [t for t in tasks if t["status"] == status]
    
    return {
        "total": len(tasks),
        "waiting": len([t for t in tasks if t["status"] == "waiting"]),
        "in_progress": len([t for t in tasks if t["status"] == "in_progress"]),
        "completed": len([t for t in tasks if t["status"] == "completed"]),
        "failed": len([t for t in tasks if t["status"] == "failed"]),
        "tasks": tasks
    }
```

---

### Step 4：实现 Worker Agent 功能

**每个 Worker Agent 中的功能**：
```python
# 检查任务池
def check_tasks():
    """检查任务池，获取分配给本 Agent 的任务"""
    tasks = load_from_tasks_json()
    
    # 过滤出分配给本 Agent 的待处理任务
    agent_id = "agent:" + get_current_agent_id() + ":main"
    my_tasks = [
        t for t in tasks
        if t["assignee"] == agent_id and t["status"] == "waiting"
    ]
    
    return my_tasks

# 执行任务
def execute_task(task: dict):
    """执行任务"""
    try:
        # 更新任务状态为"进行中"
        update_task_status(task["id"], "in_progress")
        
        # 执行任务（根据任务类型调用相应的函数）
        result = execute_task_by_type(task)
        
        # 更新任务状态为"完成"
        update_task_status(task["id"], "completed", result=result)
        
        return {"status": "success", "result": result}
    
    except Exception as e:
        # 更新任务状态为"失败"
        update_task_status(task["id"], "failed", error=str(e))
        
        return {"status": "error", "error": str(e)}

# 更新任务状态
def update_task_status(task_id: str, status: str, result=None, error=None):
    """更新任务状态"""
    tasks = load_from_tasks_json()
    
    for task in tasks:
        if task["id"] == task_id:
            task["status"] = status
            task["updatedAt"] = datetime.now().isoformat()
            
            if status == "completed":
                task["completedAt"] = datetime.now().isoformat()
                task["result"] = result
            elif status == "failed":
                task["error"] = error
            elif status == "in_progress":
                task["status"] = "in_progress"
    
    save_to_tasks_json(tasks)
    
    # 同步到飞书 Bitable
    sync_to_feishu({"id": task_id, "status": status, "result": result, "error": error})
```

---

### Step 5：配置心跳机制

**每个 Agent 的 HEARTBEAT.md**：
```markdown
# 心跳配置

interval_minutes: 5  # 每 5 分钟检查一次

on_heartbeat:
  - check_tasks()  # 检查任务池
  - update_agent_status()  # 更新 Agent 状态
  - report_completion()  # 汇报完成的任务（如果有）
```

**心跳实现**：
```python
# 心跳函数
def heartbeat():
    """心跳函数，定期执行"""
    try:
        # 检查任务池
        tasks = check_tasks()
        
        if tasks:
            # 执行第一个任务
            result = execute_task(tasks[0])
        else:
            # 没有任务，记录到日志
            log_to_file("heartbeat.log", "No tasks found")
        
        # 更新 Agent 状态
        update_agent_status("active")
    
    except Exception as e:
        # 更新 Agent 状态为错误
        update_agent_status("error", error=str(e))
        log_to_file("heartbeat.log", f"Heartbeat error: {str(e)}")

# 定时器
import schedule

schedule.every(5).minutes.do(heartbeat)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🎯 优先级建议

### 阶段 1：本地实现（立即可做）
1. 创建本地 JSON 文件
2. 实现 Coordinator Agent 的任务分配功能
3. 实现 Worker Agent 的任务检查和执行功能
4. 实现心跳机制

### 阶段 2：飞书集成（1-2 小时）
1. 配置飞书 Bitable API
2. 实现同步到飞书的功能
3. 创建 3 个表
4. 测试同步

### 阶段 3：优化和监控（可延后）
1. 添加任务优先级机制
2. 添加任务依赖关系
3. 添加任务超时机制
4. 添加任务重试机制

---

## 📋 总结

### 任务池表结构
- 表 1：任务主表（11 个字段）
- 表 2：Agent 状态表（5 个字段）
- 表 3：任务队列表（5 个字段）

### 实现方案
- 推荐方案：飞书 Bitable + 本地 JSON
- 优势：可视化 + 快速访问

### 实现步骤
1. 配置飞书 Bitable API
2. 创建本地 JSON 文件
3. 实现 Coordinator Agent 功能
4. 实现 Worker Agent 功能
5. 配置心跳机制

---

**创建时间**: 2026-02-23 23:30
